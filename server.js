const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Ler as variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || "https://szzdogbpbnjzlxesnree.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6emRvZ2JwYm5qemx4ZXNucmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTk2NzAsImV4cCI6MjEwNTU5NTY3MH0.kTjWQYGKdWQXl4yYpbzUD27k29hEuU0jnnKm-0xnwsw";

// Criar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);