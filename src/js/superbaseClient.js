

const supabaseUrl = 'https://mllcxecflmjwzbamhjzq.supabase.co'; // replace this
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbGN4ZWNmbG1qd3piYW1oanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODY4NzMsImV4cCI6MjA2NzU2Mjg3M30.16d6W6nYx9G-fP9dY0iPQcQs6TBPqzswSZJSEix4ZW4'; // replace this

const { createClient } = supabase;
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
