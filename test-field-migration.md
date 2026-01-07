# Testing Field Key Migration

## How to Test

1. **Start the dev server:**
   ```bash
   lumo dev
   ```

2. **Create a test page schema:**
   - Go to Settings > Schema
   - Create a new page schema with a field (e.g., key: `description`, label: `Description`, type: `text`)
   - Save it

3. **Create a test page using that schema:**
   - Go to Content
   - Create a new page
   - Fill in the `description` field with some content
   - Save the page

4. **Change the field key:**
   - Go back to Settings > Schema
   - Edit the page schema
   - Change the field key from `description` to `summary`
   - **Keep the label and type the same** (this is important!)
   - Save the schema

5. **Check the logs:**
   - In your terminal where `lumo dev` is running, you should see:
     ```
     [Migration] Detected field key change: "description" -> "summary"
     [Schema Update] Page schema "..." - detected 1 field key changes
     [Schema Update] Starting migration for page schema "..."...
     [Migration] Migrating page ... (...):
     [Schema Update] Migrated 1 page translations after field key changes
     ```

6. **Verify the content is preserved:**
   - Go back to Content and edit the page you created
   - The content should now appear in the `summary` field (not lost!)

## Important Notes

### Migration Detection Rules

The migration system uses **position-based detection**:
- Fields are matched by their position in the schema
- If a field at position N has a different key than before, the content is migrated
- You can change the key, label, type, and required status all at once - it will still migrate!

**✅ Works in all cases:**
- Change key only ✓
- Change key + label ✓
- Change key + type ✓
- Change key + label + type + required ✓

**⚠️ Only limitation:**
- If you **reorder fields** and also change keys, migration might map incorrectly
- **Best practice:** Don't reorder and rename fields at the same time

### Logs Location

- Console logs will appear in the terminal running `lumo dev`
- Look for lines starting with `[Migration]` or `[Schema Update]`

### Troubleshooting

If data is lost:
1. Check the terminal logs to see if migration was triggered
2. Verify you didn't change the label or type at the same time as the key
3. Check if the `detectFieldKeyChanges` function found any matches

If no logs appear:
1. Make sure you're watching the correct terminal
2. Try restarting the dev server
3. Check that the schema update API call succeeded
