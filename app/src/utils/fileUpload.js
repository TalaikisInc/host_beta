import mimeTypes from 'mime-types'

const DEFAULT_FILES_TO_IGNORE = [
  '.DS_Store',
  'Thumbs.db'
]

function shouldIgnoreFile(file) {
  return DEFAULT_FILES_TO_IGNORE.indexOf(file.name) >= 0
}

function traverseDirectory(entry) {
  const reader = entry.createReader();
  return new Promise((resolveDirectory) => {
    const iterationAttempts = []
    const errorHandler = () => {}
    function readEntries() {
      reader.readEntries((batchEntries) => {
        if (!batchEntries.length) {
          resolveDirectory(Promise.all(iterationAttempts))
        } else {
          iterationAttempts.push(Promise.all(batchEntries.map((batchEntry) => {
            if (batchEntry.isDirectory) {
              return traverseDirectory(batchEntry)
            }
            return Promise.resolve(batchEntry)
          })))
          readEntries()
        }
      }, errorHandler)
    }
    readEntries()
  })
}

function packageFile(file, entry) {
  let fileTypeOverride = '';
  const hasExtension = file.name && file.name.lastIndexOf('.') !== -1
  if (hasExtension && !file.type) {
    fileTypeOverride = mimeTypes.lookup(file.name)
  }

  return {
    fileObject: file,
    type: file.type ? file.type : fileTypeOverride,
    name: file.name,
    size: file.size,
    fullPath: entry ? entry.fullPath : file.name
  }
}

function getFile(entry) {
  return new Promise((resolve) => {
    entry.file((file) => {
      resolve(packageFile(file, entry))
    })
  })
}

function handleFilePromises(promises, fileList) {
  return Promise.all(promises).then((files) => {
    files.forEach((file) => {
      if (!shouldIgnoreFile(file)) {
        fileList.push(file)
      }
    })

    return fileList
  })
}

export function getDataTransferFiles(dataTransfer) {
  const dataTransferFiles = []
  const folderPromises = []
  const filePromises = []

  [].slice.call(dataTransfer.items).forEach((listItem) => {
    if (typeof listItem.webkitGetAsEntry === 'function') {
      const entry = listItem.webkitGetAsEntry()

      if (entry && entry.isDirectory) {
        folderPromises.push(traverseDirectory(entry))
      } else {
        filePromises.push(getFile(entry))
      }
    } else {
      dataTransferFiles.push(listItem)
    }
  })
  if (folderPromises.length) {
    const flatten = (array) => array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])
    return Promise.all(folderPromises).then((fileEntries) => {
      const flattenedEntries = flatten(fileEntries);
      flattenedEntries.forEach((fileEntry) => {
        filePromises.push(getFile(fileEntry))
      })

      return handleFilePromises(filePromises, dataTransferFiles)
    })
  } else if (filePromises.length) {
    return handleFilePromises(filePromises, dataTransferFiles)
  }
  return Promise.resolve(dataTransferFiles)
}

export function getDroppedOrSelectedFiles(event) {
  const dataTransfer = event.dataTransfer;
  if (dataTransfer && dataTransfer.items) {
    return getDataTransferFiles(dataTransfer).then((fileList) => {
      return Promise.resolve(fileList)
    })
  }

  const files = [];
  const dragDropFileList = dataTransfer && dataTransfer.files;
  const inputFieldFileList = event.target && event.target.files
  const fileList = dragDropFileList || inputFieldFileList || []

  for (let i = 0; i < fileList.length; i++) {
    files.push(packageFile(fileList[i]));
  }

  return Promise.resolve(files)
}
