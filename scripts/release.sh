#!/bin/bash

set -e

# Colors for better output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHANGELOG_FILE="CHANGELOG.md"
PACKAGE_JSON="package.json"
TEMP_RELEASE_NOTES=".release-notes.md"

# Function to extract version from package.json
get_current_version() {
    current_version=$(grep -o '"version": *"[^"]*"' "$PACKAGE_JSON" | cut -d'"' -f4)
    echo "$current_version"
}

# Function to extract GitHub repository from git remote
get_github_repo() {
    remote_url=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$remote_url" ]; then
        # Try to extract username/repo format
        echo "$remote_url" | sed -n 's/.*github\.com[:/]\([^/]*\/[^.]*\).*/\1/p'
    else
        echo ""
    fi
}

# Function to get commits since the last tag
get_commits_since() {
    local tag=$1

    if [ -n "$tag" ]; then
        git log "$tag..HEAD" --pretty=format:"%h %s" --no-merges
    else
        # Try to get the latest tag
        latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

        if [ -n "$latest_tag" ]; then
            git log "$latest_tag..HEAD" --pretty=format:"%h %s" --no-merges
        else
            # No tags found, get all commits
            git log --pretty=format:"%h %s" --no-merges
        fi
    fi
}

# Function to categorize commits using grep instead of bash regex
categorize_commits() {
    local commits_file=$1
    local feat_file="$TEMP_DIR/feat.txt"
    local fix_file="$TEMP_DIR/fix.txt"
    local docs_file="$TEMP_DIR/docs.txt"
    local style_file="$TEMP_DIR/style.txt"
    local refactor_file="$TEMP_DIR/refactor.txt"
    local test_file="$TEMP_DIR/test.txt"
    local chore_file="$TEMP_DIR/chore.txt"
    local other_file="$TEMP_DIR/other.txt"

    # Create empty files
    >"$feat_file"
    >"$fix_file"
    >"$docs_file"
    >"$style_file"
    >"$refactor_file"
    >"$test_file"
    >"$chore_file"
    >"$other_file"

    # Use grep to categorize
    grep "^[a-f0-9]\+ feat" "$commits_file" >"$feat_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ fix" "$commits_file" >"$fix_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ docs" "$commits_file" >"$docs_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ style" "$commits_file" >"$style_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ refactor" "$commits_file" >"$refactor_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ test" "$commits_file" >"$test_file" 2>/dev/null || true
    grep "^[a-f0-9]\+ chore" "$commits_file" >"$chore_file" 2>/dev/null || true

    # Add any commits that don't match the above patterns to other
    cat "$feat_file" "$fix_file" "$docs_file" "$style_file" "$refactor_file" "$test_file" "$chore_file" | sort >"$TEMP_DIR/matched.txt"
    comm -23 <(sort "$commits_file") "$TEMP_DIR/matched.txt" >"$other_file" || true
}

# Function to update the CHANGELOG.md file
update_changelog() {
    local version=$1
    local date=$2
    local temp_changelog="$TEMP_DIR/changelog_temp.md"

    # Create new changelog entry
    {
        echo "## [$version] - $date"
        echo
    } >"$temp_changelog"

    # Add features
    if [ -s "$TEMP_DIR/feat.txt" ]; then
        {
            echo "### Features"
            echo
            while IFS= read -r line; do
                hash=$(echo "$line" | cut -d' ' -f1)
                message=$(echo "$line" | cut -d' ' -f2-)
                echo "- $message ([$hash])"
            done <"$TEMP_DIR/feat.txt"
            echo
        } >>"$temp_changelog"
    fi

    # Add bug fixes
    if [ -s "$TEMP_DIR/fix.txt" ]; then
        {
            echo "### Bug Fixes"
            echo
            while IFS= read -r line; do
                hash=$(echo "$line" | cut -d' ' -f1)
                message=$(echo "$line" | cut -d' ' -f2-)
                echo "- $message ([$hash])"
            done <"$TEMP_DIR/fix.txt"
            echo
        } >>"$temp_changelog"
    fi

    # Add other categories
    for category in "docs:Documentation" "style:Styles" "refactor:Refactoring" "test:Tests" "chore:Chores" "other:Other Changes"; do
        cat_file=$(echo "$category" | cut -d':' -f1)
        cat_title=$(echo "$category" | cut -d':' -f2)

        if [ -s "$TEMP_DIR/$cat_file.txt" ]; then
            {
                echo "### $cat_title"
                echo
                while IFS= read -r line; do
                    hash=$(echo "$line" | cut -d' ' -f1)
                    message=$(echo "$line" | cut -d' ' -f2-)
                    echo "- $message ([$hash])"
                done <"$TEMP_DIR/$cat_file.txt"
                echo
            } >>"$temp_changelog"
        fi
    done

    # If CHANGELOG.md exists, update it
    if [ -f "$CHANGELOG_FILE" ]; then
        # Extract header (everything before the first entry)
        sed -n '/^## \[/q;p' "$CHANGELOG_FILE" >"$TEMP_DIR/header.md"

        # Combine header, new entry, and existing entries
        {
            cat "$TEMP_DIR/header.md"
            cat "$temp_changelog"

            # Add existing entries (skipping the header)
            sed -n '/^## \[/,$p' "$CHANGELOG_FILE"
        } >"$TEMP_DIR/new_changelog.md"

        mv "$TEMP_DIR/new_changelog.md" "$CHANGELOG_FILE"
    else
        # Create new CHANGELOG.md file
        {
            echo "# Changelog"
            echo
            echo "All notable changes to this project will be documented in this file."
            echo
            cat "$temp_changelog"
        } >"$CHANGELOG_FILE"
    fi

    echo -e "${GREEN}Updated $CHANGELOG_FILE with $version changes${NC}"
}

# Create GitHub release
create_github_release() {
    local version=$1
    local release_notes="$TEMP_RELEASE_NOTES"

    # Create release notes
    {
        # Add features
        if [ -s "$TEMP_DIR/feat.txt" ]; then
            echo "### Features"
            echo
            while IFS= read -r line; do
                hash=$(echo "$line" | cut -d' ' -f1)
                message=$(echo "$line" | cut -d' ' -f2-)
                echo "- $message ($hash)"
            done <"$TEMP_DIR/feat.txt"
            echo
        fi

        # Add bug fixes
        if [ -s "$TEMP_DIR/fix.txt" ]; then
            echo "### Bug Fixes"
            echo
            while IFS= read -r line; do
                hash=$(echo "$line" | cut -d' ' -f1)
                message=$(echo "$line" | cut -d' ' -f2-)
                echo "- $message ($hash)"
            done <"$TEMP_DIR/fix.txt"
            echo
        fi

        # Add other categories
        for category in "docs:Documentation" "style:Styles" "refactor:Refactoring" "test:Tests" "chore:Chores" "other:Other Changes"; do
            cat_file=$(echo "$category" | cut -d':' -f1)
            cat_title=$(echo "$category" | cut -d':' -f2)

            if [ -s "$TEMP_DIR/$cat_file.txt" ]; then
                echo "### $cat_title"
                echo
                while IFS= read -r line; do
                    hash=$(echo "$line" | cut -d' ' -f1)
                    message=$(echo "$line" | cut -d' ' -f2-)
                    echo "- $message ($hash)"
                done <"$TEMP_DIR/$cat_file.txt"
                echo
            fi
        done
    } >"$release_notes"

    # Check if gh CLI is installed
    if command -v gh &>/dev/null; then
        echo -e "${BLUE}Creating GitHub release...${NC}"
        gh release create "v$version" --title "v$version" --notes-file "$release_notes"
        echo -e "${GREEN}GitHub release v$version created successfully!${NC}"
    else
        echo -e "${RED}Failed to create GitHub release: GitHub CLI (gh) not installed${NC}"
        echo -e "${YELLOW}\nManual steps to create a release:${NC}"
        echo -e "1. Go to https://github.com/$GITHUB_REPO/releases/new"
        echo -e "2. Enter \"v$version\" as the tag and title"
        echo -e "3. Copy the content from $release_notes file and paste it into the description"
        echo -e "4. Click \"Publish release\""
    fi
}

# Update version in package.json
update_version() {
    local new_version=$1

    # Use sed to update version in package.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS uses different sed syntax
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    else
        # Linux and others
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    fi

    echo -e "${GREEN}Updated $PACKAGE_JSON to version $new_version${NC}"
}

# Main script execution starts here
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR" "$TEMP_RELEASE_NOTES"' EXIT

# Check for dry run mode
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}Running in dry-run mode. No changes will be committed.${NC}"
fi

echo -e "${BLUE}========= Release Script =========${NC}"

# Get current version from package.json
CURRENT_VERSION=$(get_current_version)
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Get GitHub repository information
GITHUB_REPO=$(get_github_repo)
if [ -n "$GITHUB_REPO" ]; then
    echo -e "GitHub repository: ${YELLOW}$GITHUB_REPO${NC}"
else
    echo -e "${YELLOW}Warning: Could not determine GitHub repository. Some features may be limited.${NC}"
fi

# Ask for the new version
read -p "Enter the new version (current: $CURRENT_VERSION): " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$CURRENT_VERSION}

# Get commits since the last tag
echo -e "${BLUE}Fetching commits since the last release...${NC}"
commits=$(get_commits_since)
echo "$commits" >"$TEMP_DIR/commits.txt"

if [ ! -s "$TEMP_DIR/commits.txt" ]; then
    echo -e "${YELLOW}No new commits found since the last release.${NC}"
    exit 0
fi

commit_count=$(wc -l <"$TEMP_DIR/commits.txt")
echo -e "Found ${YELLOW}$commit_count${NC} commits since the last release."

# Categorize commits
categorize_commits "$TEMP_DIR/commits.txt"

# Display summary
echo -e "\n${BLUE}Commit Summary:${NC}"
for category in feat fix docs style refactor test chore other; do
    count=$(wc -l <"$TEMP_DIR/$category.txt")
    if [ "$count" -gt 0 ]; then
        echo -e "- $category: $count commits"
    fi
done

# Check if only 'other' commits are found - may need manual intervention
other_count=$(wc -l <"$TEMP_DIR/other.txt")
total_conv_count=0
for category in feat fix docs style refactor test chore; do
    conv_count=$(wc -l <"$TEMP_DIR/$category.txt")
    total_conv_count=$((total_conv_count + conv_count))
done

if [ "$other_count" -gt 0 ] && [ "$total_conv_count" -eq 0 ]; then
    echo -e "${YELLOW}Warning: No conventional commits detected. Only 'other' commits found.${NC}"
    read -p "Would you like to manually enter changes? (y/n): " manual_changes

    if [[ "$manual_changes" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Enter changes (one per line, empty line to finish):${NC}"
        echo -e "${BLUE}Format: type: description (e.g. 'feat: Add new feature')${NC}"

        >"$TEMP_DIR/manual_changes.txt"
        while true; do
            read -p "> " change
            if [ -z "$change" ]; then
                break
            fi
            echo "$change" >>"$TEMP_DIR/manual_changes.txt"
        done

        # Process manual changes
        >"$TEMP_DIR/feat.txt"
        >"$TEMP_DIR/fix.txt"
        >"$TEMP_DIR/docs.txt"
        >"$TEMP_DIR/style.txt"
        >"$TEMP_DIR/refactor.txt"
        >"$TEMP_DIR/test.txt"
        >"$TEMP_DIR/chore.txt"
        >"$TEMP_DIR/other.txt"

        while IFS= read -r line; do
            # Use a random hash for manual entries
            hash=$(echo "$RANDOM$RANDOM" | md5sum | cut -c1-7)

            if [[ "$line" =~ ^feat:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/feat.txt"
            elif [[ "$line" =~ ^fix:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/fix.txt"
            elif [[ "$line" =~ ^docs:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/docs.txt"
            elif [[ "$line" =~ ^style:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/style.txt"
            elif [[ "$line" =~ ^refactor:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/refactor.txt"
            elif [[ "$line" =~ ^test:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/test.txt"
            elif [[ "$line" =~ ^chore:.*$ ]]; then
                echo "$hash $line" >>"$TEMP_DIR/chore.txt"
            else
                echo "$hash $line" >>"$TEMP_DIR/other.txt"
            fi
        done <"$TEMP_DIR/manual_changes.txt"

        # Display updated summary
        echo -e "\n${BLUE}Updated Commit Summary:${NC}"
        for category in feat fix docs style refactor test chore other; do
            count=$(wc -l <"$TEMP_DIR/$category.txt")
            if [ "$count" -gt 0 ]; then
                echo -e "- $category: $count entries"
            fi
        done
    fi
fi

# If dry run, exit here
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Dry run completed. Exiting without making changes.${NC}"
    exit 0
fi

# Ask for confirmation
read -p $'\nDo you want to proceed with the release? (y/n): ' confirmation
if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Release cancelled by user.${NC}"
    exit 0
fi

# Update package.json with the new version
echo -e "${BLUE}Updating package.json to version $NEW_VERSION...${NC}"
update_version "$NEW_VERSION"

# Update changelog
echo -e "${BLUE}Updating changelog...${NC}"
today=$(date +%Y-%m-%d)
update_changelog "$NEW_VERSION" "$today"

# Commit changes
echo -e "${BLUE}Committing version and changelog changes...${NC}"
git add "$PACKAGE_JSON" package-lock.json "$CHANGELOG_FILE"
git commit -m "chore: release v$NEW_VERSION"

# Create a git tag
echo -e "${BLUE}Creating git tag v$NEW_VERSION...${NC}"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Ask if the user wants to push changes
read -p $'\nDo you want to push the changes and tags to remote? (y/n): ' push_confirmation
if [[ "$push_confirmation" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Pushing changes and tags to remote...${NC}"
    git push
    git push --tags

    # Create GitHub release
    create_github_release "$NEW_VERSION"
else
    echo -e "${YELLOW}Changes are committed locally but not pushed. Push manually when ready.${NC}"
fi

echo -e "\n${GREEN}Release process completed successfully!${NC}"
