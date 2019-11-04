<?php

namespace Controllers {

    use Core\{
        Controller,
        Database,
        Router,
        View
    };
    use Helpers\{
        Locale,
        Errors,
        Output,
        Data\Currency,
    };
    use Libraries\{
        Screens,
        Telegram,
    };
    use Models\Collection\{
        Languages,
        ProjectChatMessages,
        MVProjectLangs,
        Payments,
        ProjectLangs,
        Projects,
        MVProjectFilterAvailableLangs,
        MVProjectSearchs,
        Users,
    };
    use Models\Table\{
        Language,
        Project,
        ProjectChatMessage,
        ProjectLang,
        Redirect,
    };
    use Models\{
        AuthModel,
    };
    use Models\Constant\{
        ProjectStatus,
        Views,
    };
    use Requests\Investment\{
        AddRequest,
        ChangeStatusRequest,
        ChatMessagesRequest,
        CheckSiteRequest,
        RedirectRequest,
        SetChatMessageRequest,
        ShowRequest,
    };
    use Requests\Telegram\SendPhotoRequest;
    use Traits\AuthTrait;
    use Views\Investment\{
        Added,
        ProjectFilter,
        Registration,
        Show,
        NoShow,
    };

    class Investment extends Controller {
        use AuthTrait;
        private CONST
            LIMIT = 20,
            GUEST_USER_ID = 2;

        public function registration() {
            $params = [
                'payments'                  => new Payments(),
                'mainProjectLanguages'      => new Languages('pos is not null', 'pos asc'),
                'secondaryProjectLanguages' => new Languages('pos is null'),
                'currency'                  => Currency::getCurrency(),
                'authModel'                 => AuthModel::getInstance(),
            ];

            Output::addView(Registration::class, $params);
            Output::addFunction('ProjectRegistration');
        }

        public function show(ShowRequest $request) {
            $MVProjectFilterAvailableLangs = new MVProjectFilterAvailableLangs(['status_id' => $request->getActual('status')]);
            if (!$MVProjectFilterAvailableLangs->get()) {
                // без фильтра
                return self::noShow([Views::PROJECT_FILTER => '']);
            }
            $languages = new Languages(['id' => $MVProjectFilterAvailableLangs->getValuesByKey()]);
            /** @var Language $pageLanguage текущий язык*/
            $pageLanguage = $languages->getByKeyAndValue('shortname', $request->getActual('lang'));

            $projectFilter = (new View(ProjectFilter::class, [
                'request'                       => $request,
                'url'                           => Router::getInstance()->getCurrentPageUrl(),
                'languages'                     => $languages,
                'MVProjectFilterAvailableLangs' => $MVProjectFilterAvailableLangs,
                'pageLanguage'                  => $pageLanguage ?? new Language(['flag' => 'xx']), // фэйк
            ]));

            if (!$pageLanguage) {
                return self::noShow([Views::PROJECT_FILTER => $projectFilter]);
            }

            // ID найденных проектов
            $projectSearchs = new MVProjectSearchs([
                'lang_id' => $pageLanguage->id,
                'status_id' => $request->getActual('status'),
            ], min(self::LIMIT, $MVProjectFilterAvailableLangs->{$pageLanguage->id}->cnt));

            if (empty($projectSearchs->get())) {
                return self::noShow([Views::PROJECT_FILTER => $projectFilter]);
            }

            $projectIds     = $projectSearchs->getValuesByKey();
            $projects       = new Projects(['id' => $projectIds]);
            if (!$projects->get()) {
                return self::noShow([Views::PROJECT_FILTER => $projectFilter]);
            }
            $MVProjectLangs = new MVProjectLangs(['id' => $projectIds]);
            $payments       = new Payments(['id' => $projects->getUniqueValuesByKey('id_payments')]);
            $projectLangs   = new ProjectLangs(['project_id' => $projectIds, 'lang_id' => $pageLanguage->id]);

            $pageParams = [
                'projects'            => $projects,
                'MVProjectLangs'      => $MVProjectLangs,
                'pageLanguage'        => $pageLanguage,
                'payments'            => $payments,
                'projectLangs'        => $projectLangs,
                'languages'           => $languages,
                'isAdmin'             => AuthModel::isAdmin(),
                Views::PROJECT_FILTER => $projectFilter,
            ];

            Output::addFunctions([
                'setStorage' => ['lang' => $pageLanguage->id, 'chat' => []],
                'initChat',
                'panelScrollerInit',
                'imgClickInit',
                'loadRealThumbs',
                'checkChats',
            ], Output::DOCUMENT);

            Output::addView(Show::class, $pageParams);
        }

        private static function noShow(array $pageParams) {
            Output::addView(NoShow::class, $pageParams);
        }

        public function add(AddRequest $request, CheckSiteRequest $checkSiteRequest) {
            Database::startTransaction();
            Errors::exitIfExists();

            $url = $this->checkWebsite($checkSiteRequest, true);

            if (count(array_unique([
                count($request->plan_percents),
                count($request->plan_period),
                count($request->plan_period_type),
                count($request->plan_start_deposit),
                count($request->plan_currency_type)
                ])) !== 1)
            {
                // Кол-во элементов отличается
                Errors::add(Locale::get('plans'), 'error', true);
            }

            // Сохраняем проект
            $project = (new Project())->fromArray($request->toArray());
            $project->admin     = AuthModel::getUserId() ?? self::GUEST_USER_ID;
            $project->url       = $url;
            $project->ref_url   = $checkSiteRequest->website;
            $project->status_id = AuthModel::isAdmin() ? ProjectStatus::ACTIVE : ProjectStatus::NOT_PUBLISHED;
            $project->save();

            Screens::saveScreenShot($url, $project->id);

            // Сохраняем описания
            foreach ($request->description as $langId => $description) {
                $projectLang = new ProjectLang();
                $projectLang->project_id  = $project->id;
                $projectLang->lang_id     = $langId;
                $projectLang->description = str_replace("\n", '</br>', $description);
                $projectLang->save();
                unset($projectLang);
            }

            self::refreshMViews();

            Output::addView(Added::class);
            Output::addAlertSuccess(Locale::get('success'), Locale::get('project_is_added'));

            $message = new SendPhotoRequest([
                'chat_id' => Telegram::MY_TELEGRAM_ID,
                'caption' => sprintf('New project is added *%s* (%s)', $project->name, $project->url),
                'photo'   => Screens::getOriginalJpgScreen($project->id),
            ]);
            Telegram::sendPhoto($message);
        }

        public function changeStatus(ChangeStatusRequest $request) {
            static::adminAccess();

            $project = (new Project())->getById($request->project);
            $project->status_id = $request->status;
            $project->save();

            self::refreshMViews();
            \Controllers\Users::reloadPage();
        }

        private static function refreshMViews() {
            // Обновляем вьюшки @TODO перенести в rabbit
            MVProjectFilterAvailableLangs::refresh();
            MVProjectLangs::refresh();
            MVProjectSearchs::refresh();
        }

        public function checkWebsite(CheckSiteRequest $request, bool $getUrl = false) : string {
            $url = self::getParsedUrl(str_replace('www.', '', strtolower($request->website)));

            if (($res = Project::getDb()->selectRow(['url' => $url]))) {
                Errors::add('website', Locale::get('site_exists'), true);
            }
            elseif ($getUrl) return $url;
            else Output::addFieldSuccess('website', Locale::get('site_is_free'));
        }

        private static function getParsedUrl(string $url) {
            $urlParsed = parse_url($url);

            if (isset($urlParsed['scheme'], $urlParsed['host'])) {
                if (count(explode('.', $url)) < 2) {
                    Errors::add('website', Locale::get('wrong_url'), true);
                }
                $url = $urlParsed['scheme'] . '://' . $urlParsed['host'];
            }
            elseif (isset($urlParsed['host'])) {
                $url = 'http://' . $urlParsed['host'];
            }
            elseif (isset($urlParsed['path'])) {
                return self::getParsedUrl('http://' . $urlParsed['path']);
            }

            return $url;
        }

        public function sendMessage(SetChatMessageRequest $request) {
            (new ProjectChatMessage([
                'user_id'       => AuthModel::getUserId(),
                'project_id'    => $request->project,
                'lang_id'       => $request->lang,
                'message'       => $request->message,
                'session_id'    => AuthModel::getInstance()->session_id,
            ]))->save();

            Output::addFunction('checkChats');
        }

        public function getChatMessages(ChatMessagesRequest $request) {
            $messages = new ProjectChatMessages($request);

            if ($messages->get()) {
                $userIds = $messages->getUniqueValuesByKey('user_id');
                if (!empty($userIds)) {
                    $users = new Users(['id' => $messages->getUniqueValuesByKey('user_id')], ['id', 'login', 'name', 'status_id']);
                    Output::addFunction('setNewChatMessages', ['users' => $users->toArray()]);
                }
                Output::addFunction('setNewChatMessages', ['messages' => $messages->toArray()]);
            }
            Output::addFunction('sleepAndCheckChats');
        }

        public function redirect(RedirectRequest $request) {
            Errors::exitIfExists(Output::E404);

            (new Redirect([
                'user_id' => AuthModel::getUserId(),
                'project_id' => $request->project,
                'session_id' => AuthModel::getInstance()->session_id,
            ]))->save();

            $project = (new Project())->getById($request->project);

            header('HTTP/1.1 200 OK');
            header('Location: ' . $project->ref_url);
        }
    }

}