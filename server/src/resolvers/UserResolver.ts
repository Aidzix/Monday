import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { User } from '../models/User';
import { Context } from '../types/Context';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | null> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      return null;
    }
  }

  @Mutation(() => User)
  async register(
    @Arg('name') name: string,
    @Arg('email') email: string,
    @Arg('password') password: string
  ): Promise<User> {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role: 'user',
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;
    return profile;
  }

  @Mutation(() => User)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: Context
  ): Promise<User> {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error('Invalid email or password');
    if (!authData.user) throw new Error('Invalid email or password');

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Generate JWT token
    const token = jwt.sign(
      { userId: profile.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.setHeader('Authorization', `Bearer ${token}`);
    return profile;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async logout(@Ctx() { res }: Context): Promise<boolean> {
    res.removeHeader('Authorization');
    return true;
  }

  @Query(() => [User])
  @Authorized(['admin'])
  async users(): Promise<User[]> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return users;
  }

  @Mutation(() => User)
  @Authorized(['admin'])
  async updateUser(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('email', { nullable: true }) email?: string,
    @Arg('role', { nullable: true }) role?: string
  ): Promise<User> {
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error('User not found');

    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedUser;
  }

  @Mutation(() => Boolean)
  @Authorized(['admin'])
  async deleteUser(@Arg('id') id: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
} 