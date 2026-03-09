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

    // Map DB columns to app model
    return (data || []).map(entry => ({
      ...entry,
      id: entry.id,
      userId: entry.user_id,
      photo: entry.photo_url || entry.photo, // Map photo_url to photo
    }));
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    throw error;
  }
}

export async function createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Extract only the fields that exist in the database schema
    const payload = {
      user_id: user.id,
      photo_url: entry.photo,
      caption: entry.caption,
      mood: entry.mood,
      date: entry.date,
      location: entry.location,
      // Note: tags, palette, likes, comments are not in the schema yet or handled separately
    };

    const { data, error } = await supabase
      .from('diary_entries')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating entry:', error);
      throw new Error('Failed to create entry');
    }

    // Merge returned data with original entry data to preserve client-side fields (like tags) if needed
    return { 
        ...entry, // Keep original fields like tags/palette
        ...data, 
        userId: data.user_id,
        photo: data.photo_url 
    };
  } catch (error: any) {
    console.error('Error creating entry:', error);
    throw error;
  }
}

export async function updateEntry(id: string, entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Extract only the fields that exist in the database schema
    const payload = {
      photo_url: entry.photo,
      caption: entry.caption,
      mood: entry.mood,
      date: entry.date,
      location: entry.location,
    };

    const { data, error } = await supabase
      .from('diary_entries')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entry:', error);
      throw new Error('Failed to update entry');
    }

    return { 
        ...entry, // Keep original fields
        ...data, 
        userId: data.user_id, 
        photo: data.photo_url 
    };
  } catch (error: any) {
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
  } catch (error: any) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}