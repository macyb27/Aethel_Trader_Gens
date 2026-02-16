import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to securely store the API key
export const storeApiKey = async (key) => {
    try {
        await SecureStore.setItemAsync('api_key', key);
        console.log('API key stored securely.');
    } catch (error) {
        console.error('Error storing API key:', error);
    }
};

// Function to retrieve the API key
export const getApiKey = async () => {
    try {
        const key = await SecureStore.getItemAsync('api_key');
        if (key) {
            console.log('Retrieved API key.');
            return key;
        } else {
            console.log('No API key found.');
            return null;
        }
    } catch (error) {
        console.error('Error retrieving API key:', error);
        return null;
    }
};