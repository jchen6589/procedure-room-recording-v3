# Define source and destination directories
$sourceDir = "C:\TEST" # Adjust the path to the source folder if necessary
$destDir = "C:\EncryptedFiles" # Adjust the path to the destination folder if necessary
$zipExePath = "C:\Program Files\7-Zip\7z.exe"  # Adjust the path to 7z.exe if necessary
$password = "GCSI"  # Adjust password if necessary

# Create the destination folder if it doesn't exist
if (-not (Test-Path $destDir)) {
    New-Item -Path $destDir -ItemType Directory
    Write-Host "Created destination folder: $destDir"
}

# Function to encrypt files
function Encrypt-File {
    param (
        [string]$filePath
    )
    
    # Skip .ps1 files
    if ($filePath -like "*.ps1") {
        Write-Host "Skipping PowerShell script: $filePath"
        return
    }

    $fileName = [System.IO.Path]::GetFileName($filePath)
    $encryptedFilePath = Join-Path $destDir "$fileName.7z"

    # Encrypt the file using 7-Zip
    Write-Host "Encrypting '$fileName'..."
    try {
        & $zipExePath a -p"$password" $encryptedFilePath $filePath 
        Write-Host "Encrypted '$fileName' and saved it to '$encryptedFilePath'"

        # Delete the original file after encryption
        Remove-Item $filePath
        Write-Host "Deleted the original file: $fileName"
    }
    catch {
        Write-Host "Error encrypting '$fileName': $_"
    }
}

# Process existing files in the folder
$existingFiles = Get-ChildItem -Path $sourceDir -File
foreach ($file in $existingFiles) {
    Encrypt-File -filePath $file.FullName
}

# Set up a file system watcher to monitor the source directory
$fsWatcher = New-Object IO.FileSystemWatcher
$fsWatcher.Path = $sourceDir
$fsWatcher.Filter = "*.*"
$fsWatcher.IncludeSubdirectories = $false
$fsWatcher.EnableRaisingEvents = $true

# Define the action to take when a new file is created
$onCreatedAction = {
    $newFile = $Event.SourceEventArgs.FullPath
    Encrypt-File -filePath $newFile
}

# Attach the event handler
Register-ObjectEvent $fsWatcher "Created" -Action $onCreatedAction

# Keep the script running to watch for file creation events
Write-Host "Monitoring $sourceDir for new files. Press Ctrl+C to stop."

while ($true) {
    Start-Sleep -Seconds 10
}