<?php

namespace Models\Collection {

    use Core\AbstractEntity;
    use Interfaces\EntityInterface;
    use Interfaces\ModelInterface;
    use Models\MView\MVProjectFilterAvailableLang;
    use Traits\IteratorTrait;
    use Traits\Model;

    /**
     * @property MVProjectFilterAvailableLang[] $this
     */
    class MVProjectFilterAvailableLangs extends AbstractEntity implements EntityInterface, ModelInterface, \Iterator {
        use Model;
        use IteratorTrait;

        private static $table = 'MV_ProjectFilterAvailableLangs';

        protected $data;

        protected static
            $defaults = null,
            $properties = [
                self::COLLECTION  => [self::TYPE_DTO_ARRAY, MVProjectFilterAvailableLang::class, 'lang_id'],
            ];

        final public function __construct(array $where) {
            $this->fillCollection(self::getDb()->select($where, MVProjectFilterAvailableLang::getPropertyKeys()));
        }
    }
}