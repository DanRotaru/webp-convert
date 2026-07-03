function showErrorMsg(invalidFiles) {
  if (
    (null !== errMsgTimer && clearTimeout(errMsgTimer),
    $("#msgTxt").empty(),
    $("#errMsg").finish().css({
      top: "-1000px",
    }),
    0 !== invalidFiles.length)
  ) {
    if (1 < invalidFiles.length) {
      let listHtml = "";
      for (let i = 0; i < invalidFiles.length; i++)
        listHtml += "<li>- " + invalidFiles[i] + "</li>";
      $("#msgTxt").html(
        "<strong>" +
          invalidFilesPlural +
          "</strong><ul class='msgUL'>" +
          listHtml +
          "</ul>",
      );
    } else
      $("#msgTxt").html(
        "<strong>" +
          invalidFileSingular +
          "</strong><br /><span class='msgSpan'>- " +
          invalidFiles +
          "</span>",
      );
  }
  $("#errMsg")
    .stop(true, true)
    .animate(
      {
        top: "20px",
      },
      function () {
        errMsgTimer = setTimeout(function () {
          $("#errMsg").animate({
            top: "-1000px",
          });
        }, 5000);
      },
    );
}
($("#closeErrMsg").on("click", function () {
  ($("#errMsg").animate({
    top: "-1000px",
  }),
    clearTimeout(errMsgTimer));
}),
  (fileUpload.onchange = function () {
    $("html, body").animate(
      {
        scrollTop: $("#WEBP-Converter").offset().top,
      },
      500,
    );
    const invalidFiles = [];
    let fileName, isValid;
    for (let i = 0; i < fileUpload.files.length; i++)
      ((fileName = fileUpload.files[i].name),
        (isValid =
          -1 !== $.inArray(fileName.toLowerCase().split(".").pop(), ext)),
        isValid
          ? resizeImageToSpecificWidth(fileUpload.files[i])
          : invalidFiles.push(fileName),
        0 !== invalidFiles.length && showErrorMsg(invalidFiles));
    $(this).val(null);
  }));
function resizeImageToSpecificWidth(file) {
  ($("#clearAll").prop("disabled", false),
    $("#downloadAll").prop("disabled", true),
    reset ||
      ($("#filesList").removeClass("filesListBorder"),
      $("#files").addClass("grayBorder"),
      $("#dropFilesPlaceHolder").hide(),
      (reset = true)));
  let reader = new FileReader();
  ((reader.onload = function (e) {
    let img = new Image();
    ($(img).on("load", function () {
      let $thumbCanvas = $("<canvas>"),
        thumbCanvas = $thumbCanvas.get(0),
        thumbCtx = thumbCanvas.getContext("2d");
      ((thumbCanvas.width = 150), (thumbCanvas.height = 150));
      let scale = Math.min(150 / img.width, 150 / img.height),
        drawWidth = img.width * scale,
        drawHeight = img.height * scale;
      thumbCtx.drawImage(
        img,
        (150 - drawWidth) / 2,
        (150 - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      let $thumbImg = $("<img class='uploadedImg' />");
      $thumbImg.attr("src", thumbCanvas.toDataURL());
      let fileExt = file.name.split(".").pop().toLowerCase(),
        hasTransparency = false;
      (("gif" == fileExt || "png" == fileExt) &&
        (thumbCtx.drawImage(img, 0, 0, 100, 100),
        (hasTransparency = isTransparent(thumbCtx, 100))),
        hasTransparency
          ? $thumbImg.addClass("tilesPattern")
          : $thumbImg.on("load", function () {
              const avgColor = getAverageRGB(this);
              $(this).css(
                "backgroundColor",
                "rgb(" + avgColor.r + "," + avgColor.g + "," + avgColor.b + ")",
              );
            }),
        thumbCtx.clearRect(0, 0, 150, 150));
      let thumbId = "img" + Date.now(),
        $imgDiv = $("<div class='uploadedImgDiv' id='" + thumbId + "' />"),
        $header = $(
          "<header class='imgHead'><p class='imgName'></p><svg class='removeImgBtn' viewBox='0 0 18 18' width='18' height='18'><use xlink:href='#remove'></use ></svg ></header>",
        ),
        $fileState = $(
          '<div class="fileState" state="N"><svg class="fileStateIcon" viewBox="0 0 26 42" width="26" height="42"><use xlink: href="#waiting"></use></svg ><p class="fileStateText">' +
            waitingText +
            "</p></div>",
        ),
        $footer = $(
          '<footer class="imgFooter"><div class="progressBar"></div><div class="progressText">' +
            formatBytes(file.size) +
            "</div></footer>",
        );
      ($imgDiv.append($thumbImg, $header, $fileState, $footer),
        $imgDiv.appendTo($("#filesList")),
        (thumbId = $("#" + thumbId)),
        filesQueue.push([
          file,
          thumbId,
          null,
          null,
          $("#userQuality option:selected").val(),
          null,
          null,
        ]),
        $imgDiv.find(".removeImgBtn").on("click", function () {
          const index = filesQueue.findIndex((entry) => entry[1] == thumbId);
          (activeCompareInd === index
            ? $("#sliderCont").hide()
            : index < activeCompareInd && (activeCompareInd -= 1),
            "U" === $imgDiv.find(".fileState").attr("state")
              ? (filesQueue[index][2].abort(),
                index + 1 == filesQueue.length && (startUpload = false),
                index < filesQueue.length - 1 &&
                "N" == filesQueue[index + 1][1].find(".fileState").attr("state")
                  ? (filesQueue.splice(index, 1), doConvert(index))
                  : filesQueue.splice(index, 1))
              : filesQueue.splice(index, 1));
          let remaining = filesQueue.length;
          ($imgDiv.remove(),
            0 < remaining &&
              remaining == $(".fileState[state='D']").length &&
              $("#downloadAll").prop("disabled", false),
            0 == remaining &&
              ($("#clearAll").click(),
              $("#clearAll,#downloadAll").prop("disabled", true)),
            $("#downloadCount").text(
              filesQueue.filter(function (entry) {
                return null !== entry[3];
              }).length,
            ),
            onScroll(),
            $("#sliderCont").is(":visible") && $("#closeSlider").click());
        }),
        $header.find("p").text(fitText(file.name, $header.find("p")[0])),
        startUpload ||
          (0 == filesQueue.length
            ? doConvert(0)
            : doConvert(filesQueue.length - 1),
          (startUpload = true),
          (startUpload = true)),
        scrollFiles(1 / 0));
    }),
      $(img).attr("src", e.target.result));
  }),
    reader.readAsDataURL(file));
}
function doConvert(index) {
  const $fileDiv = filesQueue[index][1];
  (filesQueue[index][1]
    .find(".fileState")
    .html(
      '<svg class="fileStateIcon" viewBox="0 0 56 58" width="56" height="58"><use xlink: href="#processing"></use></svg ><p class="fileStateText">' +
        convertingText +
        "</p>",
    ),
    $fileDiv
      .find(".imgFooter")
      .html('<span class="loader"><span class="loader-inner"></span></span>'),
    new Promise(function (resolve, reject) {
      let img = new Image();
      (img.addEventListener("load", function () {
        resolve(img);
      }),
        img.addEventListener("error", function () {
          reject();
        }),
        (img.src = URL.createObjectURL(filesQueue[index][0])));
    })
      .then(
        function (img) {
          return new Promise(function (resolve, reject) {
            try {
              let canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");
              const sizeFactor = $("#userSize option:selected").val();
              ((canvas.width = img.width * sizeFactor),
                (canvas.height = img.height * sizeFactor),
                ctx.drawImage(
                  img,
                  0,
                  0,
                  img.width,
                  img.height,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                ),
                (filesQueue[index][6] = sizeFactor),
                canvas.toBlob(
                  function (blob) {
                    (resolve(URL.createObjectURL(blob)),
                      (filesQueue[index][5] = blob));
                  },
                  "image/webp",
                  parseFloat($("#userQuality option:selected").val()),
                ));
            } catch (err) {
              reject();
            }
          });
        },
        function () {
          errorIcon($fileDiv);
        },
      )
      .then(
        function (imageUrl) {
          return new Promise(function (resolve, reject) {
            let scaledImg = new Image();
            (scaledImg.addEventListener("load", function () {
              resolve({
                imageURL: imageUrl,
                scaledImg: scaledImg,
              });
            }),
              scaledImg.addEventListener("error", function () {
                reject();
              }),
              scaledImg.setAttribute("src", imageUrl));
          });
        },
        function () {
          errorIcon($fileDiv);
        },
      )
      .then(
        function (result) {
          $fileDiv
            .find(".fileState")
            .html(
              '<svg class="fileStateIcon" viewBox="0 0 122.877 101.052" width="35px" height="35px"><use xlink:href="#done"></use></svg >',
            )
            .attr("state", "D");
          let $imgName = $fileDiv.find(".imgName"),
            newName = $imgName.text();
          ((newName = newName.substr(0, newName.lastIndexOf(".")) + ".webp"),
            $imgName.text(fitText(newName, $imgName[0])),
            $("#downloadCount").text(
              filesQueue.filter(function (entry) {
                return null !== entry[3];
              }).length,
            ),
            (newName = filesQueue[index][0].name),
            (newName = newName.substr(0, newName.lastIndexOf(".")) + ".webp"),
            (filesQueue[index][3] = newName));
          const $fileDivRef = filesQueue[index][1];
          ($fileDiv
            .find(".imgFooter")
            .html(
              '<a class="download" href="' +
                result.imageURL +
                '" download=' +
                newName +
                ">" +
                downloadText +
                "</a><svg class='editImgBtn' viewBox='0 0 1024 1024'><use xlink:href='#edit'></use ></svg >",
            )
            .addClass("imgFooterNoBG"),
            $fileDiv.find(".editImgBtn").on("click", function () {
              const index = filesQueue.findIndex(
                (entry) => entry[1] == $fileDivRef,
              );
              (initSlider(index),
                $(".uploadedImgDiv").removeClass("activeThumb"),
                $fileDiv.addClass("activeThumb"));
            }),
            $("#downloadCount").text(
              filesQueue.filter(function (entry) {
                return null !== entry[3];
              }).length,
            ),
            (index += 1),
            filesQueue.length > index && doConvert(index),
            filesQueue.length == index &&
              $("#downloadAll").prop("disabled", false),
            (startUpload = false),
            $.get("https://example.com/counter"));
        },
        function () {
          errorIcon($fileDiv);
        },
      ));
}
function errorIcon($fileDiv) {
  ($fileDiv
    .find(".fileState")
    .html(
      '<svg class="fileStateIcon" viewBox="0 0 48 48" width="56" height="56"><use xlink: href="#error"></use></svg ><p class="fileStateText">Error</p>',
    ),
    $fileDiv.find(".imgFooter").hide());
}
function getAverageRGB(img) {
  var imageData,
    width,
    height,
    dataLength,
    defaultRgb = {
      r: 255,
      g: 255,
      b: 255,
    },
    canvas = document.createElement("canvas"),
    ctx = canvas.getContext && canvas.getContext("2d"),
    i = -4,
    rgb = {
      r: 0,
      g: 0,
      b: 0,
    },
    count = 0;
  if (!ctx) return defaultRgb;
  ((height = canvas.height =
    img.naturalHeight || img.offsetHeight || img.height),
    (width = canvas.width = img.naturalWidth || img.offsetWidth || img.width),
    ctx.drawImage(img, 0, 0));
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch (err) {
    return defaultRgb;
  }
  for (dataLength = imageData.data.length; (i += 20) < dataLength;)
    (++count,
      (rgb.r += imageData.data[i]),
      (rgb.g += imageData.data[i + 1]),
      (rgb.b += imageData.data[i + 2]));
  return (
    (rgb.r = ~~(rgb.r / count)),
    (rgb.g = ~~(rgb.g / count)),
    (rgb.b = ~~(rgb.b / count)),
    rgb
  );
}
function fitText(text, element) {
  const canvas = $("<canvas>")[0],
    ctx = canvas.getContext("2d", {
      alpha: false,
    }),
    style = window.getComputedStyle(element),
    maxWidth = element.offsetWidth;
  let textWidth,
    tailWidth,
    headWidth = 0,
    charCount = 0;
  if (
    ((ctx.font =
      style.getPropertyValue("font-weight") +
      " " +
      style.getPropertyValue("font-size") +
      " " +
      style.getPropertyValue("font-family")),
    (textWidth = ctx.measureText(text).width),
    textWidth <= maxWidth)
  )
    return text;
  for (
    text = [text.slice(0, -7), text.slice(-7)],
      tailWidth = ctx.measureText(text[1]).width;
    headWidth + tailWidth < maxWidth;
  )
    ((charCount += 1),
      (headWidth = ctx.measureText(text[0].slice(0, charCount) + "...").width));
  return text[0].slice(0, charCount - 1) + "..." + text[1];
}
function isTransparent(ctx, size) {
  let data = ctx.getImageData(0, 0, size, size).data,
    transparent = false;
  for (let i = 3, dataLength = data.length; i < dataLength; i += 4)
    if (255 > data[i]) {
      transparent = true;
      break;
    }
  return transparent;
}
function formatBytes(bytes) {
  if (0 === bytes) return "0 Bytes";
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  let value = bytes / Math.pow(1024, unitIndex);
  return (
    (2 == unitIndex ? parseFloat(value.toFixed(1)) : parseInt(value)) +
    " " +
    ["Bytes", "KB", "MB"][unitIndex]
  );
}
$("#clearAll").on("click", function () {
  (currentAJAXUpload &&
    $.isFunction(currentAJAXUpload.promise) &&
    currentAJAXUpload.abort(),
    currentAJAXConvert &&
      $.isFunction(currentAJAXConvert.promise) &&
      currentAJAXConvert.abort(),
    (activeCompareInd = -1),
    (filesQueue.length = 0),
    (startUpload = false),
    $("#filesList").empty(),
    $("#downloadCount").text("0"),
    $("#filesList").addClass("filesListBorder"),
    $("#files").removeClass("grayBorder"),
    $("#dropFilesPlaceHolder").show(),
    $("#sliderCont").hide(),
    $(".nextBtn,.prevBtn").addClass("disabled"),
    $("#clearAll,#downloadAll").prop("disabled", true),
    (reset = false));
});
var Promise = window.Promise;
Promise || (Promise = JSZip.external.Promise);
function urlToPromise(url) {
  return new Promise(function (resolve, reject) {
    JSZipUtils.getBinaryContent(url, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}
($("#downloadAll").on("click", function () {
  var zip = new JSZip();
  let dupCount = 0,
    names = [];
  for (let i = 0; i < filesQueue.length; i++)
    names.push(filesQueue[i][3].replace(/.*\//g, ""));
  for (let i = 0; i < names.length - 1; i++) {
    dupCount = 0;
    for (let j = i + 1; j < names.length; j++)
      names[i] === names[j] &&
        ((dupCount += 1),
        (names[j] = names[j].replace(".webp", "") + "_" + dupCount + ".webp"));
  }
  for (let i = 0; i < filesQueue.length; i++)
    zip.file(names[i], filesQueue[i][5]);
  zip
    .generateAsync({
      type: "blob",
    })
    .then(function (zipBlob) {
      saveAs(zipBlob, "toWEBP.zip");
    });
}),
  $("#filesList,.uploadedImgDiv, #filesScroll").on("dragover", function (e) {
    (e.preventDefault(),
      e.stopPropagation(),
      (e.originalEvent.dataTransfer.dropEffect = "copy"));
  }),
  $("#filesList,.uploadedImgDiv, #filesScroll").on("dragenter", function (e) {
    (e.preventDefault(), e.stopPropagation());
  }),
  $("#filesList, .uploadedImgDiv, #filesScroll").on("drop", function (e) {
    if (
      ($("html, body").animate(
        {
          scrollTop: $("#WEBP-Converter").offset().top,
        },
        500,
      ),
      e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length)
    ) {
      (e.preventDefault(), e.stopPropagation());
      const invalidFiles = [];
      let fileName, isValid;
      divE = e.originalEvent.dataTransfer.files;
      for (let i = 0; i < e.originalEvent.dataTransfer.files.length; i++)
        ((fileName = e.originalEvent.dataTransfer.files[i].name),
          (isValid =
            -1 !== $.inArray(fileName.toLowerCase().split(".").pop(), ext)),
          isValid
            ? resizeImageToSpecificWidth(e.originalEvent.dataTransfer.files[i])
            : invalidFiles.push(fileName),
          0 !== invalidFiles.length && showErrorMsg(invalidFiles));
    }
  }));
function scrollFiles(target) {
  let parent = filesParent.parentNode;
  (("prev" === target || "next" === target) &&
    (target = getPosition(target, parent)),
    new SmoothScroll(parent).scrollTo(target, 500));
}
function getPosition(direction, container) {
  let width = container.offsetWidth,
    scrollLeft = container.scrollLeft,
    offsetLeft = filesParent.offsetLeft;
  if ("prev" === direction) {
    let elem = getElemAfter(scrollLeft - width + offsetLeft);
    return elem.offsetLeft || 0;
  } else {
    let elem = getElemAfter(scrollLeft + width - 2 * offsetLeft);
    return (
      (elem = elem
        ? elem
        : {
            offsetLeft: 1 / 0,
          }),
      Math.min(elem.offsetLeft, container.scrollWidth - width)
    );
  }
}
function getElemAfter(position) {
  let children = Array.prototype.slice.call(filesParent.children);
  for (let key in children) {
    let child = children[key];
    if (child.offsetLeft >= position) return child;
  }
  return null;
}
(function () {
  const instances = [];
  window.SmoothScroll = function (elem) {
    function initInstance() {
      ((this.scrollTo = scrollToFn),
        (this.stop = stopFn),
        (this.tick = tickFn),
        (this.elem = elem),
        (this.pos = {
          from: null,
          to: null,
          dur: null,
        }),
        (this.time = {
          start: null,
          end: null,
        }),
        (this.timerId = null),
        (this.duration = null),
        instances.push(this));
    }
    function scrollToFn(target, duration, callback) {
      this.stop();
      let width = this.elem.offsetWidth,
        maxScroll = this.elem.scrollWidth - width;
      return (
        (this.pos.from = this.elem.scrollLeft),
        (this.callback = callback),
        (target >= maxScroll && maxScroll === this.pos.from) ||
        (0 >= target && !this.pos.from)
          ? void (this.callback && this.callback())
          : void ((this.pos.to = Math.max(0, Math.min(maxScroll, target))),
            (this.pos.dur = this.pos.to - this.pos.from),
            (this.duration =
              this.pos.to != target && this.pos.to && Number.isFinite(target)
                ? duration * (this.pos.to / target)
                : duration),
            (this.time.start = performance.now()),
            (this.time.end = this.time.start + this.duration),
            this.tick())
      );
    }
    function stopFn() {
      (cancelAnimationFrame(this.timerId), initInstance.call(this));
    }
    function tickFn() {
      let now = performance.now();
      ((this.time.dur = now - this.time.start),
        (value = easeInOut(
          this.time.dur,
          this.pos.from,
          this.pos.dur,
          this.duration,
        )),
        (this.elem.scrollLeft = value),
        now < this.time.end && value != this.pos.to
          ? (this.timerId = requestAnimationFrame(tickFn.bind(this)))
          : ((this.elem.scrollLeft = this.pos.to),
            this.callback && this.callback(),
            onScroll(),
            this.stop()));
    }
    function easeInOut(t, b, c, d) {
      return ((t /= d / 2), 1 > t)
        ? (c / 2) * t * t + b
        : (t--, (-c / 2) * (t * (t - 2) - 1) + b);
    }
    for (let key in instances) {
      let instance = instances[key];
      if (instance.elem === elem) return instance;
    }
    initInstance.call(this);
  };
})();
function onScroll() {
  let container = filesParent.parentNode;
  (0 >= container.scrollLeft
    ? $(".prevBtn").addClass("disabled")
    : $(".prevBtn").removeClass("disabled"),
    container.scrollLeft >= container.scrollWidth - container.offsetWidth
      ? $(".nextBtn").addClass("disabled")
      : $(".nextBtn").removeClass("disabled"));
}
let prevQuality, tempBlob, orgIsLoaded, modIsLoaded;
function initSlider(index) {
  ((size1 = 0),
    (size2 = 0),
    (orgIsLoaded = false),
    (modIsLoaded = false),
    $("#loaderImages").show(),
    $("#orgSize,#modSize").text("---"),
    $("#orgImg,#modImg").prop("src", "data:,"),
    $("#applyQuality").removeClass("applied"),
    (activeCompareInd = index),
    $("#qualityLoaderCont").fadeOut(),
    $("#sliderCont").css({
      display: "flex",
    }),
    $("html, body").animate(
      {
        scrollTop: $("#sliderCont").offset().top - 20,
      },
      300,
    ),
    (orgImg = $("#orgImg")),
    (modImg = $("#modImg")),
    getRawImgResized(),
    modImg
      .on("load", function () {
        (modImg.prop(
          "style",
          "clip:rect(0," +
            modImg.width() +
            "px," +
            modImg.height() +
            "px," +
            modImg.width() / 2 +
            "px)",
        ),
          getImageSize(modImg.prop("src"), "#modSize"),
          (modIsLoaded = true),
          orgIsLoaded && $("#loaderImages").hide(),
          $(this).off("load"));
      })
      .prop("src", URL.createObjectURL(filesQueue[index][5])),
    $(slider).prop("style", ""),
    (prevQuality = parseInt(100 * filesQueue[index][4])),
    $("#orgNM").text(filesQueue[index][0].name),
    $("#modNM").text(filesQueue[index][3]),
    $("#qualityRange").off(),
    $("#qualityRange").val(prevQuality),
    $("#quality").text(prevQuality),
    $("#qualityRange").prop("disabled", false),
    $("#applyQuality").prop("disabled", true),
    $("#qualityRange").on("mouseup touchend keyup", function () {
      (disEnQulaity(true),
        new Promise(function (resolve) {
          let img = new Image();
          (img.addEventListener("load", function () {
            resolve(img);
          }),
            (img.src = URL.createObjectURL(filesQueue[activeCompareInd][0])));
        })
          .then(function (img) {
            return new Promise(function (resolve) {
              let canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");
              const sizeFactor = filesQueue[activeCompareInd][6];
              ((canvas.width = img.width * sizeFactor),
                (canvas.height = img.height * sizeFactor),
                ctx.drawImage(
                  img,
                  0,
                  0,
                  img.width,
                  img.height,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                ),
                canvas.toBlob(
                  function (blob) {
                    ((tempBlob = blob), resolve(URL.createObjectURL(blob)));
                  },
                  "image/webp",
                  parseFloat($("#qualityRange").val() / 100),
                ));
            });
          })
          .then(function (imageUrl) {
            return new Promise(function (resolve) {
              function onLoad() {
                (resolve({
                  imageURL: imageUrl,
                  scaledImg: modImgEl,
                }),
                  getImageSize(modImg.prop("src"), "#modSize"),
                  disEnQulaity(false),
                  (modIsLoaded = true),
                  modImgEl.removeEventListener("load", onLoad));
              }
              let modImgEl = $("#modImg")[0];
              (modImgEl.addEventListener("load", onLoad),
                modImgEl.setAttribute("src", imageUrl));
            });
          }));
    }),
    $("#qualityRange").on("input", function () {
      ($("#quality").text($(this).val()),
        $("#applyQuality").removeClass("applied"));
    }));
}
$("#applyQuality").on("click", function () {
  ((filesQueue[activeCompareInd][4] = parseFloat($("#quality").text() / 100)),
    (filesQueue[activeCompareInd][5] = tempBlob),
    $(".activeThumb")
      .find(".download")
      .prop("href", URL.createObjectURL(filesQueue[activeCompareInd][5])),
    $("#applyQuality").addClass("applied"));
});
function disEnQulaity(disabled) {
  ($("#qualityRange,#applyQuality").prop("disabled", disabled),
    disabled
      ? $("#qualityLoaderCont").fadeIn()
      : $("#qualityLoaderCont").fadeOut());
}
function getRawImgResized() {
  new Promise(function (resolve) {
    let img = new Image();
    (img.addEventListener("load", function () {
      resolve(img);
    }),
      (img.src = URL.createObjectURL(filesQueue[activeCompareInd][0])));
  })
    .then(function (img) {
      return new Promise(function (resolve) {
        let canvas = document.createElement("canvas"),
          ctx = canvas.getContext("2d");
        const sizeFactor = filesQueue[activeCompareInd][6];
        ((canvas.width = img.width * sizeFactor),
          (canvas.height = img.height * sizeFactor),
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            canvas.width,
            canvas.height,
          ),
          canvas.toBlob(function (blob) {
            resolve(URL.createObjectURL(blob));
          }));
      });
    })
    .then(function (imageUrl) {
      return new Promise(function (resolve) {
        let $orgImg = $("#orgImg");
        $orgImg
          .on("load", function () {
            let orgEl = $("#orgImg")[0];
            resolve({
              imageURL: imageUrl,
              xxx: orgEl,
            });
            let $org = $("#orgImg");
            (getImageSize(null, "#orgSize"),
              $org.prop(
                "style",
                "clip:rect(0," +
                  $org.width() / 2 +
                  "px," +
                  $org.height() +
                  "px,0)",
              ),
              (orgIsLoaded = true),
              modIsLoaded && $("#loaderImages").hide(),
              $org.off("load"));
          })
          .prop("src", imageUrl);
      });
    });
}
(slider.addEventListener("mousedown", slideReady),
  window.addEventListener("mouseup", slideFinish),
  slider.addEventListener("touchstart", slideReady, {
    passive: true,
  }),
  window.addEventListener("touchend", slideFinish));
function slideReady(e) {
  (e.preventDefault(),
    (isDown = true),
    (e = e.changedTouches ? e.changedTouches[0] : e),
    (offsetX = slider.offsetLeft - e.clientX),
    window.addEventListener("mousemove", slideMove),
    window.addEventListener("touchmove", slideMove));
}
function slideFinish() {
  isDown = false;
}
var lastSliderPos, lastBoxWidth, lastOrgRight;
function slideMove(e) {
  if (isDown) {
    if (
      ((e = e.changedTouches ? e.changedTouches[0] : e),
      15 > e.clientX + offsetX + $("#slider").width() / 2)
    )
      return;
    if (e.clientX + offsetX > $("#compareDiv").width() + 2) return;
    ((slider.style.left = e.clientX + offsetX + "px"),
      (lastOrgRight =
        e.clientX +
        offsetX +
        (orgImg.width() / 2 - $("#compareDiv").width() / 2)),
      orgImg.prop(
        "style",
        "clip:rect(0," + lastOrgRight + "px," + orgImg.height() + "px,0)",
      ),
      modImg.prop(
        "style",
        "clip:rect(0," +
          modImg.width() +
          "px," +
          modImg.height() +
          "px," +
          (e.clientX +
            offsetX +
            (modImg.width() / 2 - $("#compareDiv").width() / 2)) +
          "px)",
      ),
      (lastSliderPos = e.clientX + offsetX),
      (lastBoxWidth = $("#compareDiv").width()));
  }
}
($("#closeSlider").on("click", function () {
  ($(".uploadedImgDiv").removeClass("activeThumb"),
    $("#sliderCont").hide(),
    $("html, body").animate(
      {
        scrollTop: $("#WEBP-Converter").offset().top - 20,
      },
      500,
    ),
    currentAJAXApply &&
      $.isFunction(currentAJAXApply.promise) &&
      currentAJAXApply.abort(),
    currentAJAXAdjust &&
      $.isFunction(currentAJAXAdjust.promise) &&
      currentAJAXAdjust.abort());
}),
  $(window).on("resize", function () {
    if ((onScroll(), $("#compareDiv").is(":visible"))) {
      let ratio = parseFloat($("#compareDiv").width() / lastBoxWidth),
        clip = orgImg.css("clip"),
        parts = clip.replace("rect(", "").replace(")", "");
      ((slider.style.left = lastSliderPos * ratio + "px"),
        (parts = parts.split(",")));
      let pos =
        parseInt(
          lastSliderPos * ratio +
            (orgImg.width() / 2 - $("#compareDiv").width() / 2),
        ) + "px";
      ((parts[1] = pos),
        orgImg.prop("style", "clip:rect(" + parts.join(",") + ")"),
        (clip = modImg.css("clip")),
        (parts = clip.replace("rect(", "").replace(")", "")),
        (parts = parts.split(",")),
        (parts[3] = pos),
        modImg.prop("style", "clip:rect(" + parts.join(",") + ")"));
    }
  }));
function getImageSize(url, selector) {
  if ("#orgSize" == selector)
    ((size1 = filesQueue[activeCompareInd][0].size),
      $(selector).text(formatBytes(size1)),
      setConvertPercent());
  else {
    var blob = null,
      xhr = new XMLHttpRequest();
    (xhr.open("GET", url, true),
      (xhr.responseType = "blob"),
      (xhr.onload = function () {
        ((blob = xhr.response),
          (size2 = blob.size),
          $(selector).text(formatBytes(size2)),
          setConvertPercent());
      }),
      xhr.send());
  }
}
function setConvertPercent() {
  if (0 !== size1 && 0 !== size2) {
    let percent = 100 - parseInt(100 * (size2 / size1));
    100 > percent &&
      0 < percent &&
      $("#modSize").text($("#modSize").text() + " (" + percent + "%)");
  }
}
function showMsg(message) {
  (null !== errMsgTimer && clearTimeout(errMsgTimer),
    $("#errMsg").finish().css({
      top: "-1000px",
    }),
    $("#msgTxt").text(message),
    $("#errMsg")
      .stop(true, true)
      .animate(
        {
          top: "20px",
        },
        function () {
          errMsgTimer = setTimeout(function () {
            $("#errMsg").animate({
              top: "-1000px",
            });
          }, 5000);
        },
      ));
}
