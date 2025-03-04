import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Item } from '../models/Item';
import { Context } from '../types/Context';
import { supabase } from '../lib/supabase';

@Resolver(Item)
export class ItemResolver {
  @Query(() => [Item])
  @Authorized()
  async items(
    @Arg('boardId') boardId: string,
    @Ctx() { req }: Context
  ): Promise<Item[]> {
    const userId = req.user?.id;

    // Check if user has access to the board
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .or(`owner_id.eq.${userId},board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Board not found or unauthorized');

    // Get items for the board
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return items;
  }

  @Query(() => Item, { nullable: true })
  @Authorized()
  async item(
    @Arg('id') id: string,
    @Ctx() { req }: Context
  ): Promise<Item | null> {
    const userId = req.user?.id;

    // Get item with board access check
    const { data: item, error } = await supabase
      .from('items')
      .select(`
        *,
        boards!inner (
          owner_id,
          board_members!inner (user_id)
        )
      `)
      .eq('id', id)
      .or(`boards.owner_id.eq.${userId},boards.board_members.user_id.eq.${userId}`)
      .single();

    if (error) return null;
    return item;
  }

  @Mutation(() => Item)
  @Authorized()
  async createItem(
    @Arg('boardId') boardId: string,
    @Arg('groupId') groupId: string,
    @Arg('title') title: string,
    @Ctx() { req }: Context,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('values', { nullable: true }) values?: Record<string, any>
  ): Promise<Item> {
    const userId = req.user?.id;

    // Check if user has access to the board
    const { data: board, error: checkError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .or(`owner_id.eq.${userId},board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Board not found or unauthorized');

    // Create item
    const { data: item, error } = await supabase
      .from('items')
      .insert([
        {
          board_id: boardId,
          group_id: groupId,
          title,
          description,
          values: values || {},
          created_by: userId,
          updated_by: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  @Mutation(() => Item)
  @Authorized()
  async updateItem(
    @Arg('id') id: string,
    @Ctx() { req }: Context,
    @Arg('title', { nullable: true }) title?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('values', { nullable: true }) values?: Record<string, any>,
    @Arg('groupId', { nullable: true }) groupId?: string
  ): Promise<Item> {
    const userId = req.user?.id;

    // Check if user has access to the item
    const { data: item, error: checkError } = await supabase
      .from('items')
      .select(`
        *,
        boards!inner (
          owner_id,
          board_members!inner (user_id)
        )
      `)
      .eq('id', id)
      .or(`boards.owner_id.eq.${userId},boards.board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Item not found or unauthorized');

    // Update item
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (values) updates.values = values;
    if (groupId) updates.group_id = groupId;
    updates.updated_by = userId;

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedItem;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async deleteItem(
    @Arg('id') id: string,
    @Ctx() { req }: Context
  ): Promise<boolean> {
    const userId = req.user?.id;

    // Check if user has access to the item
    const { data: item, error: checkError } = await supabase
      .from('items')
      .select(`
        *,
        boards!inner (
          owner_id,
          board_members!inner (user_id)
        )
      `)
      .eq('id', id)
      .or(`boards.owner_id.eq.${userId},boards.board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Item not found or unauthorized');

    // Delete item
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    return true;
  }

  @Mutation(() => Item)
  @Authorized()
  async moveItem(
    @Arg('id') id: string,
    @Arg('groupId') groupId: string,
    @Ctx() { req }: Context
  ): Promise<Item> {
    const userId = req.user?.id;

    // Check if user has access to both the item and the target group
    const { data: item, error: checkError } = await supabase
      .from('items')
      .select(`
        *,
        boards!inner (
          owner_id,
          board_members!inner (user_id)
        )
      `)
      .eq('id', id)
      .or(`boards.owner_id.eq.${userId},boards.board_members.user_id.eq.${userId}`)
      .single();

    if (checkError) throw new Error('Item not found or unauthorized');

    // Check if target group exists and belongs to the same board
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('board_id', item.board_id)
      .single();

    if (groupError) throw new Error('Target group not found');

    // Move item to new group
    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({
        group_id: groupId,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedItem;
  }
} 