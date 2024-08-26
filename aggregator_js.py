import os

def aggregate_js_files(startpath):
    excluded_folders = {'node_modules', '.git'}
    output_file = "aggregated_js_files.txt"
    
    with open(output_file, "w") as outfile:
        for root, dirs, files in os.walk(startpath):
            if any(excluded_folder in root for excluded_folder in excluded_folders):
                continue
            
            dirs[:] = [d for d in dirs if d not in excluded_folders]
            
            for file in files:
                if file.endswith(".js"):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, startpath)
                    
                    with open(file_path, "r") as infile:
                        outfile.write(f"File: {relative_path}\n")
                        outfile.write("=" * 20 + "\n")
                        outfile.write(infile.read())
                        outfile.write("\n" + "=" * 20 + "\n\n")

if __name__ == "__main__":
    aggregate_js_files(os.getcwd())
