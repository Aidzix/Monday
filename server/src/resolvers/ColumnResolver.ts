import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Board, BoardModel } from '../models/Board';
import { Context } from '../types/Context';
import { v4 as uuidv4 } from 'uuid';

@Resolver()
export class ColumnResolver {
  @Query(() => [Board])
  @Authorized()
  async columns(
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
  async createColumn(
    @Arg('boardId') boardId: string,
    @Arg('title') title: string,
    @Arg('type') type: string,
    @Arg('settings', { nullable: true }) settings?: Record<string, any>,
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

    board.columns.push({
      id: uuidv4(),
      title,
      type,
      settings: settings || {},
    });

    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async updateColumn(
    @Arg('boardId') boardId: string,
    @Arg('columnId') columnId: string,
    @Arg('title', { nullable: true }) title?: string,
    @Arg('type', { nullable: true }) type?: string,
    @Arg('settings', { nullable: true }) settings?: Record<string, any>,
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

    const column = board.columns.find((c: { id: string }) => c.id === columnId);
    if (!column) {
      throw new Error('Column not found');
    }

    if (title) column.title = title;
    if (type) column.type = type;
    if (settings) column.settings = settings;

    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async deleteColumn(
    @Arg('boardId') boardId: string,
    @Arg('columnId') columnId: string,
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

    const columnIndex = board.columns.findIndex((c: { id: string }) => c.id === columnId);
    if (columnIndex === -1) {
      throw new Error('Column not found');
    }

    // Remove column
    board.columns.splice(columnIndex, 1);
    await board.save();
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async reorderColumns(
    @Arg('boardId') boardId: string,
    @Arg('columnIds') columnIds: string[],
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

    // Validate that all columns exist
    const existingColumnIds = board.columns.map((c: { id: string }) => c.id);
    const invalidColumnIds = columnIds.filter(id => !existingColumnIds.includes(id));
    if (invalidColumnIds.length > 0) {
      throw new Error('Invalid column IDs');
    }

    // Reorder columns
    board.columns.sort((a: { id: string }, b: { id: string }) => {
      const indexA = columnIds.indexOf(a.id);
      const indexB = columnIds.indexOf(b.id);
      return indexA - indexB;
    });

    await board.save();
    return board;
  }
} 