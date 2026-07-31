import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const testId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // random valid UUID
  const { error } = await supabase
    .from("users")
    .insert({
      id: testId,
      full_name: "Test Seeder",
      email: "seeder@example.com",
      role: "student",
      student_id: "test-seeder-123"
    });

  if (error) {
    console.log("Insert failed as expected or unexpected. Error details:");
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("Details:", error.details);
  } else {
    console.log("Insert succeeded! This means no foreign key constraint is active on auth.users for this test ID.");
    // clean up
    await supabase.from("users").delete().eq("id", testId);
  }
}

testInsert();
