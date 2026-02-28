import { supabase } from './supabaseClient';
import type { DiaryEntry } from '../components/diary-entry-form';

export async function fetchEntries(): Promise<DiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
      throw new Error('Failed to fetch entries');
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
}

export async function createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('diary_entries')
      .insert([{ ...entry, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error creating entry:', error);
      throw new Error('Failed to create entry');
    }

    return data;
  } catch (error) {
    console.error('Error creating entry:', error);
    throw error;
  }
}

export async function updateEntry(id: string, entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('diary_entries')
      .update(entry)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entry:', error);
      throw new Error('Failed to update entry');
    }

    return data;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting entry:', error);
      throw new Error('Failed to delete entry');
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}