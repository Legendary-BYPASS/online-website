// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebzevljxwmvozqmudxxe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViemV2bGp4d212b3pxbXVkeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzYyMzYsImV4cCI6MjA1OTk1MjIzNn0.mN9zWuVlQyk3k_kbwf406NQ5T8FO1AvWaMyvMRT9y00'

export const supabase = createClient(supabaseUrl, supabaseKey)