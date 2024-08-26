import os

def list_files(startpath):
    excluded_folders = {'node_modules', '.git'}
    
    with open("file_structure.txt", "w") as f:
        for root, dirs, files in os.walk(startpath):
            # Skip directories in the excluded list
            if any(excluded_folder in root for excluded_folder in excluded_folders):
                continue

            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * level
            f.write(f"{indent}{os.path.basename(root)}/\n")
            subindent = ' ' * 4 * (level + 1)
            for file in files:
                f.write(f"{subindent}{file}\n")

            # Remove excluded folders from dirs to prevent descending into them
            dirs[:] = [d for d in dirs if d not in excluded_folders]

if __name__ == "__main__":
    list_files(os.getcwd())
