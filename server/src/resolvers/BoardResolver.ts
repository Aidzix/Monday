import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Board } from '../models/Board';
import { Context } from '../types/Context';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

@Resolver(Board)
export class BoardResolver {
  @Query(() => [Board])
  @Authorized()
  async boards(@Ctx() { req }: Context): Promise<Board[]> {
    const userId = req.user?.id;
    
    // Get boards where user is owner or member
    const { data: boards, error } = await supabase
      .from('boards')
      .select(`
        *,
        board_members!inner(user_id)
      `)
      .or(`owner_id.eq.${userId},board_members.user_id.eq.${userId}`);

    if (error) throw error;
    return boards;
  }

  @Query(() => Board, { nullable: true })
  @Authorized()
  async board(
    @Arg('id') id: string,
    @Ctx() { req }: Context
  ): Promise<Board | null> {
    const userId = req.user?.id;
    
    const { data: board, error } = await supabase
      .from('boards')
      .select(`
        *,
        board_members!inner(user_id)
      `)
      .eq('id', id)
      .or(`owner_id.eq.${userId},board_members.user_id.eq.${userId}`)
      .single();

    if (error) return null;
    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async createBoard(
    @Arg('title') title: string,
    @Arg('description') description: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const userId = req.user?.id;

    // Create board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert([
        {
          title,
          description,
          owner_id: userId,
          settings: {},
        },
      ])
      .select()
      .single();

    if (boardError) throw boardError;

    // Add owner as board member
    const { error: memberError } = await supabase
      .from('board_members')
      .insert([
        {
          board_id: board.id,
          user_id: userId,
        },
      ]);

    if (memberError) throw memberError;

    // Create default column
    const { error: columnError } = await supabase
      .from('columns')
      .insert([
        {
          board_id: board.id,
          title: 'Status',
          type: 'status',
          settings: {
            options: ['To Do', 'In Progress', 'Done'],
          },
        },
      ]);

    if (columnError) throw columnError;

    // Create default group
    const { error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          board_id: board.id,
          title: 'Main Group',
        },
      ]);

    if (groupError) throw groupError;

    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async updateBoard(
    @Arg('id') id: string,
    @Ctx() { req }: Context,
    @Arg('title', { nullable: true }) title?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('settings', { nullable: true }) settings?: Record<string, any>
  ): Promise<Board> {
    const userId = req.user?.id;

    // Check if user has access
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .or(`owner_id.eq.${userId},board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Board not found');

    // Update board
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (settings) updates.settings = settings;

    const { data: updatedBoard, error: updateError } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedBoard;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async deleteBoard(
    @Arg('id') id: string,
    @Ctx() { req }: Context
  ): Promise<boolean> {
    const userId = req.user?.id;

    // Check if user is owner
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (checkError) throw new Error('Board not found or unauthorized');

    // Delete board (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    return true;
  }

  @Mutation(() => Board)
  @Authorized()
  async addMember(
    @Arg('boardId') boardId: string,
    @Arg('userId') userId: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const currentUserId = req.user?.id;

    // Check if user is owner
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('owner_id', currentUserId)
      .single();

    if (checkError) throw new Error('Board not found or unauthorized');

    // Add member
    const { error: memberError } = await supabase
      .from('board_members')
      .insert([
        {
          board_id: boardId,
          user_id: userId,
        },
      ]);

    if (memberError) throw memberError;

    return board;
  }

  @Mutation(() => Board)
  @Authorized()
  async removeMember(
    @Arg('boardId') boardId: string,
    @Arg('userId') userId: string,
    @Ctx() { req }: Context
  ): Promise<Board> {
    const currentUserId = req.user?.id;

    // Check if user is owner
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('owner_id', currentUserId)
      .single();

    if (checkError) throw new Error('Board not found or unauthorized');

    // Remove member
    const { error: memberError } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    return board;
  }
} 