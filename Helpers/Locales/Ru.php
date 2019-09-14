<?php

namespace Helpers\Locales {

    use Interfaces\LocaleInterface;

    class Ru implements LocaleInterface {
        public static function getLocale():array {
            return [
                'active'            => 'Активные',
                'add'                => 'Добавить',
                'add_level'         => 'Добавить уровень',
                'add_plan'          => 'Добавить план',
                'add_project'       => 'Добавление проекта',
                'after'             => 'через',
//                'auth_4_add_project'=> 'Только авторизованные пользователи могут добавлять проекты',
                'bad_password'      => 'Неверный пароль',
                'chat'              => 'Чат',
                'check'             => 'проверить',
                'close'             => 'Закрыть',
                'currency'          => ['доллар', 'евро', 'биткоин', 'рубль', 'фунт', 'йена', 'вона', 'рупий'],
                'deposit'           => 'Депозит',
                'description'       => 'Описание',
                'download'          => 'Скачать',
                'email'             => 'Email',
                'email_confirmation'=> 'Подтверждение почты',
                'email_confirm_sent'=> 'Код подтверждения отправлен вам на почту',
                'email_is_busy'     => 'Данный email уже зарегистрирован. Введите другой',
                'enter'             => 'Войти',
                'error'             => 'Ошибка',
                'exit'              => 'Выйти',
                'free'                => 'бесплатно',
                'free_4_add_project'=> 'Добавление проекта в базу совершенно',
                'from'              => 'от',
                'general'           => 'Основное',
                'guest'             => 'Гость',
                'head'              => [
                    'keywords'      => 'хайп мониторинг 2019, высокодоходные проекты, заработок в интернете, инвестиционные проекты, пирамиды',
                    'description'   => 'Высокодоходные инвестиционные проекты 2019',
                    'title'         => 'Инвестиционная Рыночная Площадка',
                ],
                'lang'              => 'ru',
                'languages'         => 'Языки сайта',
                'level'             => 'уровень',
                'login'             => 'Логин',
                'login_is_busy'     => 'Данный логин уже зарегистрирован. Введите другой',
                'menu'              => 'Меню',
                'name'              => 'Имя',
                'need_authorization'=> 'Вам необходимо авторизоваться',
                'no'                => 'Нет',
                'no_confirm_code'   => 'Не найден код подтверждения',
                'no_user'           => 'Пользователь не найден',
                'no_project'        => 'Проект не найден',
                'not_published'     => 'Неопубликованные',
                'options'           => 'Опции',
                'or'                => 'или',
                'or_copy_link'      => 'Или скопируйте эту ссылку в ваш браузер',
                'password'          => 'Пароль',
                'payment_system'    => 'Платёжные системы',
                'payment_type'      => ['Тип выплат', 'Ручной', 'Инстант (мгновенный)', 'Автоматический'],
                'period'            => 'Период',
                'period_name'       => ['','минут','часов','дней','недель','месяцев','лет'],
                'plans'             => 'Тарифные планы',
                'preview'           => 'Эскиз',
                'profit'            => 'Прибыль',
                'project_name'      => 'Название проекта',
                'project_is_added'  => 'Проект добавлен',
                'project_url'       => 'Ссылка на проект (либо реферальная ссылка)',
                'ref_program'       => 'Реферальная программа',
                'registration'      => 'Регистрация',
                'remember'          => 'Запомнить',
                'remove'            => 'Удалить',
                'repeat_password'   => 'Повторите пароль',
                'screenshot'        => 'Скриншот сайта',
                'select_file'       => 'Выбрать файл',
                'send_form'         => 'Отправить форму',
                'show_all_langs'    => 'Показать все языки',
                'site_exists'       => 'Сайт уже в базе',
                'site_is_free'      => 'Сайта нет в базе',
                'start_date'        => 'Дата начала проекта',
                'success'           => 'Успешно',
                'user_registered'   => 'Пользователь зарегистрирован',
                'user_registration' => 'Регистрация пользователя',
                'verify_account'    => 'Подтвердить мой аккаунт',
                'view'              => 'Просмотр',
                'welcome_to'        => 'Добро пожаловать на',
                'write_message'     => 'Напишите сообщение...',
                'wrong_url'           => 'Неправильный адрес сайта',
                'yes'               => 'Да',
                'you_are_authorized'=> 'Вы авторизировались',
            ];
        }

        public static function getPeriodName(int $i, int $k):string {
            return ['минут','час','','недел','месяц',''][$i-1].(
                ($k+89)%100<4||($k+9)%10>3
                    ?['','ов','дней','ь','ев','лет'][$i-1]
                    :[['а','ы'],['','а'],['день','дня'],['я','и'],['','а'],['год','года']][$i-1][(int)($k%10>1)]
                );
        }
    }
}