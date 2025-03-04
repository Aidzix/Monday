import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
class Column {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  type!: string;

  @Field(() => JSON, { nullable: true })
  settings?: Record<string, any>;
}

@ObjectType()
class Group {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => [ID])
  itemIds!: string[];
}

@ObjectType()
export class Board {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => [ID])
  memberIds!: string[];

  @Field(() => [Column])
  columns!: Column[];

  @Field(() => [Group])
  groups!: Group[];

  @Field(() => JSON, { nullable: true })
  settings?: Record<string, any>;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
} 