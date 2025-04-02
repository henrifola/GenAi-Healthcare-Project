#!/bin/bash

# Check if this is a Git repository by ensuring the .git folder exists.
if [ ! -d ".git" ]; then
  echo "Error: .git directory not found. Please initialize a git repository first (git init)."
  exit 1
fi

echo "Setting up Git pre-commit hook..."

# Define the pre-commit hook file path.
HOOK_FILE=".git/hooks/pre-commit"

# Write the pre-commit hook script.
cat << 'EOF' > "$HOOK_FILE"
#!/bin/bash

# Run ESLint on the src directory
echo "Running ESLint on src..."
npx eslint src
ESLINT_STATUS=$?

# Run Prettier check on the src directory
echo "Running Prettier check on src..."
npx prettier --check src
PRETTIER_CHECK_STATUS=$?

# Run Prettier write on the src directory (auto-fix formatting)
echo "Running Prettier write on src..."
npx prettier --write src
PRETTIER_WRITE_STATUS=$?

# If any command fails, exit with an error to block the commit.
if [ $ESLINT_STATUS -ne 0 ] || [ $PRETTIER_CHECK_STATUS -ne 0 ] || [ $PRETTIER_WRITE_STATUS -ne 0 ]; then
  echo "Pre-commit hook failed. Please fix the errors before committing."
  exit 1
fi

exit 0
EOF

# Make the pre-commit hook executable.
chmod +x "$HOOK_FILE"

echo "Git pre-commit hook has been set up successfully."

