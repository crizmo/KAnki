//===============================//
//                               //
// Copyright Bluebotlaboratories //
//                               //
//===============================//


//function log(logData) { // Log to file
//  var currentLog = JSON.parse(window.localStorage.getItem("latest.log"));
//  currentLog.push(new Date().toISOString() + " - " + logData)
//  window.localStorage.setItem("latest.log", JSON.stringify(currentLog))
//}

function fetchFile(url, timeout, fixKindleFormatting) {
  if (typeof(fixKindleFormatting) === 'undefined') {
    fixKindleFormatting=true
  }

  return new Promise(function (callback) {
    // Create iframe
    var iframe = document.createElement("iframe");
    iframe.style = "width: 0px; height: 0px;"
    iframe.src = url;

    // Add iframe to body
    document.body.appendChild(iframe);

    // Timeout To Remove iframe
    if (timeout !== -1) {
      setTimeout(function () {
        iframe.remove();
      }, timeout || 2000);
    }

    // Add listener to iframe
    iframe.addEventListener("load", function (event) {
      // Get iframe's documentElement and clone it and get the innerHTML
      var iframeSource = (event.target.contentDocument.documentElement || event.target.contentWindow.document.documentElement).cloneNode(true).innerHTML;

      // Remove iframe from DOM
      event.target.remove();

      if (fixKindleFormatting) {
        // Replace kindle's formatting
        // (replace applies to a lot of file types, not just directory listings)
        iframeSource = iframeSource.replace('<head></head><body><pre style="word-wrap: break-word; white-space: pre-wrap;">', '').replace('</pre></body>', '');
      }

      // Resolve promise
      callback(iframeSource);
    });
  });
}

function getDirectory(location) {
  return new Promise(function (callback) {
    // Get source of directory listing
    fetchFile(location).then(function (data) {
      // Create list
      var files = [];

      // Define regex for extracting different things
      const tagReg = new RegExp('<a(\n|.)*?(?=<\/a>)', "gim");
      const hrefReg = new RegExp('href="(\n|.)*?(?=")', 'gim');
      const tagRemovalReg = new RegExp('<a(\n|.)*?>', 'gim');

      // Get anchor tags (without closing tag)
      const anchorTags = Array.from(data.matchAll(tagReg));

      for (var i = 0; i < anchorTags.length; i++) {
        // Get href source (URL)
        const source = Array.from(anchorTags[i][0].matchAll(hrefReg));

        files.push({
          "name": anchorTags[i][0].replace(tagRemovalReg, ''), // Remove anchor tags from match to get only their innerText
          "path": source[0][0].substring(6) // Remove the href=" part of the href source
        });
      }

      callback(files); // Resolve promise
    });
  });
}

function flashDisplay() {
  document.body.style = "background-color: black; color: white;";

  setTimeout(function () {
    document.body.style = "";
  }, 100)
}

function joinPaths(path1, path2) {
  if (path1.slice(-1) == '/') {
    path1 = path1.slice(0, -1);
  }

  if (path2.slice(0,2) == './') {
    path2 = path2.slice(1);
  } else if (path2[0] != '/') {
    path2 = '/' + path2;
  }

  return path1 + path2;
}