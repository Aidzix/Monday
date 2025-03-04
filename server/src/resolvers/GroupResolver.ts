import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Board, BoardModel } from '../models/Board';
import { Context } from '../types/Context';
import { v4 as uuidv4 } from 'uuid';

@Resolver()
export class GroupResolver {
  @Query(() => [Board])
  @Authorized()
  async groups(
    @Arg('boardId') boardId: string,
    @Ctx() { req }: Context
  ): Promise<Board[]> {
    const userId = req.user?.id;
    const board = await BoardModel.findOne({
      _id: boardId,
      $or: [
        { ownerId: userId },
        { memberIds: userId },
      ],
    });

    if (!board) {
      throw new Error('Board not found');
    }

    return [board];
  }

  @Mutation(() => Board)
  @Authorized()
  async createGroup(
    @Arg('boardId') boardId: string,
    @Arg('title') title: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const userId = req.user?.id;
    const board = await BoardModel.findOne({
      _id: boardId,
      $or: [
        { ownerId: userId },
        { memberIds: userId },
      ],
    });

    if (!board) {
      throw new Error('Board not found');
    }

    board.groups.push({
      id: uuidv4(),
      title,
      itemIds: [],
    });

    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async updateGroup(
    @Arg('boardId') boardId: string,
    @Arg('groupId') groupId: string,
    @Arg('title') title: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const userId = req.user?.id;
    const board = await BoardModel.findOne({
      _id: boardId,
      $or: [
        { ownerId: userId },
        { memberIds: userId },
      ],
    });

    if (!board) {
      throw new Error('Board not found');
    }

    const group = board.groups.find((g: { id: string }) => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    group.title = title;
    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async deleteGroup(
    @Arg('boardId') boardId: string,
    @Arg('groupId') groupId: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const userId = req.user?.id;
    const board = await BoardModel.findOne({
      _id: boardId,
      $or: [
        { ownerId: userId },
        { memberIds: userId },
      ],
    });

    if (!board) {
      throw new Error('Board not found');
    }

    const groupIndex = board.groups.findIndex((g: { id: string }) => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }

    // Remove group and its items
    board.groups.splice(groupIndex, 1);
    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async reorderGroups(
    @Arg('boardId') boardId: string,
    @Arg('groupIds') groupIds: string[],
    @Ctx() { req }: Context
  ): Promise<Board> {
    const userId = req.user?.id;
    const board = await BoardModel.findOne({
      _id: boardId,
      $or: [
        { ownerId: userId },
        { memberIds: userId },
      ],
    });

    if (!board) {
      throw new Error('Board not found');
    }

    // Validate that all groups exist
    const existingGroupIds = board.groups.map((g: { id: string }) => g.id);
    const invalidGroupIds = groupIds.filter(id => !existingGroupIds.includes(id));
    if (invalidGroupIds.length > 0) {
      throw new Error('Invalid group IDs');
    }

    // Reorder groups
    board.groups.sort((a: { id: string }, b: { id: string }) => {
      const indexA = groupIds.indexOf(a.id);
      const indexB = groupIds.indexOf(b.id);
      return indexA - indexB;
    });

    await board.save();
    return board;
  }
} 