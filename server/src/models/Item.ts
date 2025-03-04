import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class Item {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  boardId!: string;

  @Field(() => ID)
  groupId!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => JSON, { nullable: true })
  values?: Record<string, any>;

  @Field(() => ID)
  createdBy!: string;

  @Field(() => ID)
  updatedBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
} 