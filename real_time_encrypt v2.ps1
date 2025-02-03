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
    
    # Skip files with specific extensions (e.g., .tmp, .crdownload)
    $skipExtensions = @(".tmp", ".crdownload", ".part", ".swp")  # Add more extensions as needed
    $fileExtension = [System.IO.Path]::GetExtension($filePath).ToLower()

    if ($skipExtensions -contains $fileExtension) {
        Write-Host "Skipping temporary file: $filePath"
        return
    }

    # Skip .ps1 files (PowerShell scripts)
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

# Function to process files in the folder
function Process-Folder {
    $existingFiles = Get-ChildItem -Path $sourceDir -File
    foreach ($file in $existingFiles) {
        Encrypt-File -filePath $file.FullName
    }
}

# Initial scan to process files that were there before script start
Process-Folder

# Set up a file system watcher to monitor the source directory
$fsWatcher = New-Object IO.FileSystemWatcher
$fsWatcher.Path = $sourceDir
$fsWatcher.Filter = "*.*"
$fsWatcher.IncludeSubdirectories = $false
$fsWatcher.EnableRaisingEvents = $true

# Define the action to take when a new file is created
$onCreatedAction = {
    $newFile = $Event.SourceEventArgs.FullPath
    Write-Host "Detected new file: $newFile"
    Encrypt-File -filePath $newFile
}

# Attach the event handler
Register-ObjectEvent $fsWatcher "Created" -Action $onCreatedAction

# Simulate a "reset" every 10 seconds by scanning the folder periodically
Write-Host "Monitoring $sourceDir for new files. Press Ctrl+C to stop."

while ($true) {
    # Scan the folder every 10 seconds to process any new or existing files
    Process-Folder
    Start-Sleep -Seconds 10
}
