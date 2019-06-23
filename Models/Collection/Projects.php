<?php

namespace Models\Collection {

    use Core\AbstractEntity;
    use Interfaces\{
        EntityInterface,
        ModelInterface
    };
    use Models\Table\Project;
    use Traits\IteratorTrait;
    use Traits\Model;

    /**
     * @var Project[] $this
     */
    class Projects extends AbstractEntity implements EntityInterface, ModelInterface, \Iterator {
        use Model;
        use IteratorTrait;

        private static $table = 'project';

        protected $data;

        protected static
            $defaults = null,
            $properties = [
                self::COLLECTION  => [self::TYPE_DTO_ARRAY, Project::class, 'id'],
            ];

        final public function __construct(array $where) {
            $this->fillCollection(self::getDb()->select($where, Project::getPropertyKeys()));
        }
    }
}