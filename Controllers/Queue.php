<?php

namespace Controllers;

use DiDom\Document;
use DiDom\Element;
use HeadlessChromium\BrowserFactory;
use Libraries\Screens;
use Mappers\FacebookMapper;
use Mappers\VKMapper;
use Models\Collection\ProjectLangs;
use Models\Constant\Language;
use Models\Constant\ProjectStatus;
use Models\Table\Hyiplog;
use Models\Table\Project;
use Models\Table\ProjectLang;
use Models\Table\Queue as QueueModel;
use Models\Table\User;
use Requests\Telegram\SendPhotoRequest;
use Services\HyipboxService;
use Services\InvestmentService;
use Services\VKService;

class Queue
{
    public function __construct()
    {
        if (!CLI) {
            throw new \Exception('Only cli available');
        }
        Output()->disableLayout();
    }

    private function getPids(string $func): array
    {
        $cmd = 'ps -aux | grep "php.*/queue/'.$func.'" | grep -v grep | grep -v "/bin/sh" | awk \'{ print $2 }\'';
        $output = [];
        exec($cmd, $output);
        return $output;
    }

    private function killChrome(): void
    {
        exec('kill $(pgrep chrome)');
    }

    private function killZombies(): void
    {
        exec('ps -ef | grep defunct | grep -v grep | cut -b8-20 | xargs kill -9');
    }

    private function queue(int $actionID, callable $functionForCall): void
    {
        $queueOriginal = (new QueueModel());
        while (true) {
            $queue = clone $queueOriginal;
            $queue->getRowFromDbAndFill([
                'action_id' => $actionID,
                'status_id' => QueueModel::STATUS_CREATED,
            ]);

            if (!$queue->id) {
                unset($queue);
                sleep(3);
                continue;
            }

            $queue->status_id = QueueModel::STATUS_STARTED;
            $queue->start_time = date('Y-m-d H:i:s');
            $queue->save();

            $functionForCall($queue);

            $queue->end_time = date('Y-m-d H:i:s');
            $queue->status_id = QueueModel::STATUS_FINISHED;
            $queue->save();

            unset($queue);
        }
    }

    public function screenshot(): void
    {
        $this->killZombies();

        if (count($this->getPids(__FUNCTION__)) > 1) {
            exit(1);
        }

        $this->killChrome();
        sleep(3);

        $this->queue(QueueModel::ACTION_ID_SCREENSHOT, function (QueueModel $queue) {
            $project = (new Project())->getById($queue->payload['project_id']);

            Screens::createFolder($project->id);

            $this->reTry(static function () use ($project) {
                $factory = new BrowserFactory('google-chrome');
                $browser = $factory->createBrowser([
                    'headless' => true,
                    'noSandbox' => true,
                    'keepAlive' => false,
                    'windowSize' => [1280, 960],
                    'sendSyncDefaultTimeout' => 45000
                ]);
                $page = $browser->createPage();
                $page->navigate('https://' . $project->url)->waitForNavigation();
                sleep(7);
                $page->screenshot([
                    'format'  => 'jpeg',
                    'quality' => 95,
                ])->saveToFile(Screens::getOriginalJpgScreen($project->id));
                $page->close();
                $browser->close();
            });

            Screens::makeThumbs($project->url, $project->id);

            InvestmentService::refreshMViews();

            $user = (new User())->getById($project->admin);
            $message = new SendPhotoRequest([
                'chat_id' => \Config::TELEGRAM_ADD_GROUP_PROJECT_ID,
                'caption' => sprintf('New project %s is added by %s', $project->url, $user->login),
                'photo'   => Screens::getOriginalJpgScreen($project->id),
                'reply_markup' => [
                    'inline_keyboard' => [
                        [
                            ['text' => '👍 public', 'callback_data' => json_encode([
                                'action' => Telegram::ACTIVATE,
                                'project_id' => $project->id
                            ], JSON_THROW_ON_ERROR)],
                            ['text' => '⚒ reload screen', 'callback_data' => json_encode([
                                'action' => Telegram::RELOAD_SCREEN,
                                'project_id' => $project->id
                            ], JSON_THROW_ON_ERROR)],
                        ]
                    ]
                ],
            ]);
            App()->telegram()->sendPhoto($message);

            unset($message, $project, $browser, $page, $factory);
        });
    }

    private function reTry(callable $functionForCall, int $try = 1)
    {
        try {
            return $functionForCall();
        } catch (\Throwable $e) {
            if ($try === 3) {
                throw $e;
            }
            sleep($try * 10);
            return $this->reTry($functionForCall, ++$try);
        }
    }

    // Post to social nets
    public function post(): void
    {
        if (count($this->getPids(__FUNCTION__)) > 1) {
            exit(1);
        }

        $vkService = new VKService();
        $this->queue(QueueModel::ACTION_ID_POST_TO_SOCIAL, static function (QueueModel $queue) use ($vkService) {
            $project = (new Project())->getById($queue->payload['project_id']);

            $projectLangs = new ProjectLangs(['project_id' => $project->id]);

            $facebookPageLanguages = array_keys(FacebookMapper::getCollection());
            $vkPageLanguages = array_keys(VKMapper::getCollection());
            /** @var ProjectLang $projectLang */
            foreach ($projectLangs as $projectLang) {
                if (in_array($projectLang->lang_id, $facebookPageLanguages, true)) {
                    $url = sprintf('%s/Investment/details/site/%s/lang/%s', SITE, $project->url, Language::getConstNameLower($projectLang->lang_id));
                    $description = str_replace('</br>', '', $projectLang->description);
                    App()->facebook()->sendPhoto(
                        $projectLang->lang_id,
                        Screens::getOriginalJpgScreen($project->id),
                        sprintf("%s\n\n%s\n\n%s %s", $url, $description, '#invest', '#money'),
                    );
                }
                if (in_array($projectLang->lang_id, $vkPageLanguages, true)) {
                    $url = sprintf('%s/Investment/details/site/%s/lang/%s', SITE, $project->url, Language::getConstNameLower($projectLang->lang_id));
                    $description = str_replace('</br>', '', $projectLang->description);
                    $vkService->sendToMarket(
                        $projectLang->lang_id,
                        Screens::getOriginalJpgScreen($project->id),
                        $url,
                        sprintf("%s\n\n%s\n\n%s %s", $url, $description, '#invest', '#money'),
                        $project->name,
                    );
                }
            }

            unset($projectLangs, $project);
        });
    }

    public function checkScam(int $projectId = 0): void
    {
        if (count($this->getPids(__FUNCTION__)) > 1) {
            exit(1);
        }

        $investmentService = new InvestmentService();
        while (($project = $investmentService->getNextProject($projectId, ProjectStatus::ACTIVE))->id) {
            if ((HyipboxService::getInstance()->setUrl($project->url))->isScam()) {
                $project->status_id = ProjectStatus::SCAM;
                $project->save();

                App()->telegram()->sendPhoto(new SendPhotoRequest([
                    'chat_id' => \Config::TELEGRAM_ADD_GROUP_PROJECT_ID,
                    'caption' => sprintf('☠️ %s is scam', $project->url),
                    'photo'   => Screens::getJpgThumb($project->id),
                ]));
            }

            $projectId = $project->id;
            unset($project);
            sleep(5);
        }

        InvestmentService::refreshMViews();
    }

    public function parseNewProjects()
    {
        if (count($this->getPids(__FUNCTION__)) > 1) {
            exit(1);
        }

        $url = 'https://hyiplogs.com/hyips/?' . http_build_query([
                'hlindex[from]' => 4,
                'hlindex[to]'   => 10,
                'status[1]'     => 1,
                'design'        => 1,
                'license'       => 1,
                'monitors'      => 1,
                'deposits'      => 1,
            ]);
        try {
            $document = new Document($url, true);
            /** @var Element $row */
            foreach ($document->find('div.all-hyips-list div.item.ovh') as $row) {
                $rating = $row->first('div.hl-index-box span')->text();
                $projectUrl = $row->first('div.info-content div.name-box a.grey-link')->text();
                (new Hyiplog())->getRowFromDbAndFill(['url' => $projectUrl])->fromArray([
                    'rating' => $rating,
                ])->save();
            }
        } catch (\Throwable $e) {
        }
    }

    public function fillProject(): void {
        if (count($this->getPids(__FUNCTION__)) > 1) {
            exit(1);
        }

        $list = Hyiplog::setTable()->select(null, '*', 'id desc, rating desc', 30);
        foreach ($list as $item) {
            if (($project = (new Project())->getRowFromDbAndFill(['url' => $item['url']]))->id) {
                continue;
            }
            (new InvestmentService())->parseProject($project);
            sleep(60*5);
        }
    }
}
