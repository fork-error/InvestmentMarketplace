<?php
namespace Views\Investment; {
/**
 * @var Details $this
 * @property Project $project
 * @property ProjectLang $projectLang
 * @property AbstractLanguage $locale
 * @property Payment[] payments
 * @property Languages $languages
 */
Class Details {} }

use Helpers\Data\Currency;
use Helpers\Locales\AbstractLanguage;
use Libraries\Screens;
use Models\Collection\Languages;
use Models\Constant\ProjectStatus;
use Models\Table\{Payment, Project, Language, ProjectLang};
?>
<div class="tray tray-center" project_id="<?=$this->project->id?>">
    <div class="panel admin-form theme-primary mw1000 center-block">
        <div class="heading-border panel-<?=[
            ProjectStatus::ACTIVE        => 'success',
            ProjectStatus::PAYWAIT       => 'warning',
            ProjectStatus::NOT_PUBLISHED => 'info',
            ProjectStatus::SCAM          => 'danger',
        ][$this->project->status_id] ?? 'default'?>">
            <div class="panel-heading">
                <span class="panel-title">
                    <i class="fa fa-newspaper-o"></i><?=$this->project->name?>
                </span>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="section original-photo">
                        <img src="/<?=Screens::getOriginalJpgScreen($this->project->id)?>"
                             alt="<?=$this->project->name?>"
                        >
                    </div>
                    <div class="section-divider mt40" id="spy7">
                        <span> <?=Translate()->description?> </span>
                    </div>
                    <div class="section">
                        <?=$this->projectLang->description?>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="panel mw1000 center-block investment">
        <div class="panel-body">
            <div class="mbn flex inforow">
                <div class="mnw270" style="flex: 1 0">
                    <div class="panel-heading lh30 h-30">
                                <span class="panel-icon">
                                    <i class="fa fa-signal"></i>
                                </span>
                        <span class="panel-title"><?=Translate()->plans?></span>
                    </div>
                    <div class="panel-body panel-scroller scroller-xs scroller-pn pn scroller-active scroller-success mih-220">
                        <table class="table mbn justify">
                            <thead>
                            <tr class="">
                                <th><?=Translate()->profit?></th>
                                <th><?=Translate()->period?></th>
                                <th><?=Translate()->deposit?></th>
                            </tr>
                            </thead>
                            <tbody>
                            <?php foreach ($this->project->plan_percents as $key => $plan) {?>
                                <tr>
                                    <td><?=$this->project->plan_percents[$key]?>%</td>
                                    <td><?=$this->project->plan_period[$key] . ' ' . Translate()->getPeriodName($this->project->plan_period_type[$key], $this->project->plan_period[$key])?></td>
                                    <td><?=$this->project->plan_start_deposit[$key]?>
                                        <span class="fa"><?=Currency::getCurrency()[$this->project->plan_currency_type[$key]]['i']?></span>
                                    </td>
                                </tr>
                            <?php }?>
                            </tbody>
                        </table>
                    </div>
                </div>


                <div class="mnw270" style="flex: 20 0">
                    <div class="panel-heading lh30 h-30">
                            <span class="panel-icon">
                                <i class="fa fa-gear"></i>
                            </span>
                        <span class="panel-title"><?=Translate()->options?></span>
                    </div>
                    <div class="panel-body panel-scroller scroller-xs scroller-pn pn scroller-active scroller-success mih-220">
                        <table class="table mbn tc-bold-last table-hover justify">
                            <tbody>
                            <tr>
                                <td><?=Translate()->refProgram?></td>
                                <td><?= implode('%, ', $this->project->ref_percent) . '%'?></td>
                            </tr>
                            <tr>
                                <td><?=Translate()->languages?></td>
                                <td><?php foreach ($this->languages as $langId => $language):
                                        /** @var Language $language */ ?>
                                        <i class="flag flag-<?=$language->flag?>"
                                           title="<?=$language->name . " ({$language->own_name})"?>"></i>
                                    <?php endforeach;?>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <?=Translate()->paymentSystem?>
                                </td>
                                <td><?php foreach ($this->project->id_payments as $paymentId):
                                        /** @var Payment $payment*/ $payment = $this->payments->{$paymentId};
                                        ?>
                                        <i class="pay pay-<?=$payment->name?> mb10"
                                           title="<?=$payment->name?>"></i>
                                    <?php endforeach;?>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="panel mw1000 center-block investment">
        <div class="panel-body">
            <div class="panel-widget chat-widget">
                <div class="panel-heading lh30 h-30">
                    <span class="panel-icon">
                        <i class="fa fa-comments"></i>
                    </span>
                    <span class="panel-title"><?=Translate()->chat?></span>
                </div>
                <div class="panel-body bg-light dark panel-scroller pn mh-500">
                </div>
                <form class="admin-form chat-footer" chat_id="<?=$this->project->id?>"
                      data-chat="<?=$this->project->id?>" autocomplete="off">
                    <label class="field prepend-icon">
                        <input name="message" class="gui-input"
                               placeholder="<?=Translate()->writeMessage?>">
                        <label class="field-icon">
                            <i class="fa fa-pencil"></i>
                        </label>
                        <div class="icon_send"></div>
                    </label>
                </form>
            </div>
        </div>
    </div>
</div>