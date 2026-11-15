/*
 * Paper Shaders 0.0.82 (https://github.com/paper-design/shaders), Apache-2.0.
 * Copyright 2026 Paper. See LICENSE-paper-shaders.txt in this folder.
 *
 * MODIFIED: this file is not the original package. It holds only the
 * dithering shader and the code it needs, joined into one file with esbuild.
 * The code itself is unchanged and not minified.
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/@paper-design/shaders/dist/vertex-shader.js
var vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);
  // fit = none
  box.x = boxRatio * min(givenBoxSize.x / boxRatio, givenBoxSize.y);
  float noFitBoxWidth = box.x;
  if (u_fit == 1.) { // fit = contain
    box.x = boxRatio * min(u_resolution.x / boxRatio, u_resolution.y);
  } else if (u_fit == 2.) { // fit = cover
    box.x = boxRatio * max(u_resolution.x / boxRatio, u_resolution.y);
  }
  box.y = box.x / boxRatio;
  return vec3(box, noFitBoxWidth);
}

void main() {
  gl_Position = a_position;

  vec2 uv = gl_Position.xy * .5;
  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * 3.14159265358979323846 / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);


  // ===================================================

  float fixedRatio = 1.;
  vec2 fixedRatioBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );

  v_objectBoxSize = getBoxSize(fixedRatio, fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale = u_resolution.xy / v_objectBoxSize;

  v_objectUV = uv;
  v_objectUV *= objectWorldScale;
  v_objectUV += boxOrigin * (objectWorldScale - 1.);
  v_objectUV += graphicOffset;
  v_objectUV /= u_scale;
  v_objectUV = graphicRotation * v_objectUV;

  // ===================================================

  v_responsiveBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  float responsiveRatio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize = getBoxSize(responsiveRatio, v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale = u_resolution.xy / responsiveBoxSize;

  #ifdef ADD_HELPERS
  v_responsiveHelperBox = uv;
  v_responsiveHelperBox *= responsiveBoxScale;
  v_responsiveHelperBox += boxOrigin * (responsiveBoxScale - 1.);
  #endif

  v_responsiveUV = uv;
  v_responsiveUV *= responsiveBoxScale;
  v_responsiveUV += boxOrigin * (responsiveBoxScale - 1.);
  v_responsiveUV += graphicOffset;
  v_responsiveUV /= u_scale;
  v_responsiveUV.x *= responsiveRatio;
  v_responsiveUV = graphicRotation * v_responsiveUV;
  v_responsiveUV.x /= responsiveRatio;

  // ===================================================

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 patternBoxGivenSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  patternBoxRatio = patternBoxGivenSize.x / patternBoxGivenSize.y;

  vec3 boxSizeData = getBoxSize(patternBoxRatio, patternBoxGivenSize);
  v_patternBoxSize = boxSizeData.xy;
  float patternBoxNoFitBoxWidth = boxSizeData.z;
  vec2 patternBoxScale = u_resolution.xy / v_patternBoxSize;

  v_patternUV = uv;
  v_patternUV += graphicOffset / patternBoxScale;
  v_patternUV += boxOrigin;
  v_patternUV -= boxOrigin / patternBoxScale;
  v_patternUV *= u_resolution.xy;
  v_patternUV /= u_pixelRatio;
  if (u_fit > 0.) {
    v_patternUV *= (patternBoxNoFitBoxWidth / v_patternBoxSize.x);
  }
  v_patternUV /= u_scale;
  v_patternUV = graphicRotation * v_patternUV;
  v_patternUV += boxOrigin / patternBoxScale;
  v_patternUV -= boxOrigin;
  // x100 is a default multiplier between vertex and fragmant shaders
  // we use it to avoid UV presision issues
  v_patternUV *= .01;

  // ===================================================

  vec2 imageBoxSize;
  if (u_fit == 1.) { // contain
    imageBoxSize.x = min(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else if (u_fit == 2.) { // cover
    imageBoxSize.x = max(u_resolution.x / u_imageAspectRatio, u_resolution.y) * u_imageAspectRatio;
  } else {
    imageBoxSize.x = min(10.0, 10.0 / u_imageAspectRatio * u_imageAspectRatio);
  }
  imageBoxSize.y = imageBoxSize.x / u_imageAspectRatio;
  vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

  v_imageUV = uv;
  v_imageUV *= imageBoxScale;
  v_imageUV += boxOrigin * (imageBoxScale - 1.);
  v_imageUV += graphicOffset;
  v_imageUV /= u_scale;
  v_imageUV.x *= u_imageAspectRatio;
  v_imageUV = graphicRotation * v_imageUV;
  v_imageUV.x /= u_imageAspectRatio;

  v_imageUV += .5;
  v_imageUV.y = 1. - v_imageUV.y;
}`;

// node_modules/@paper-design/shaders/dist/shader-mount.js
var DEFAULT_MAX_PIXEL_COUNT = 1920 * 1080 * 4;
var ShaderMount = class {
  constructor(parentElement, fragmentShader, uniforms, webGlContextAttributes, speed = 0, frame = 0, minPixelRatio = 2, maxPixelCount = DEFAULT_MAX_PIXEL_COUNT, mipmaps = []) {
    __publicField(this, "parentElement");
    __publicField(this, "canvasElement");
    __publicField(this, "gl");
    __publicField(this, "program", null);
    __publicField(this, "uniformLocations", {});
    /** The fragment shader that we are using */
    __publicField(this, "fragmentShader");
    /** Stores the RAF for the render loop */
    __publicField(this, "rafId", null);
    /** Time of the last rendered frame */
    __publicField(this, "lastRenderTime", 0);
    /** Total time that we have played any animation, passed as a uniform to the shader for time-based VFX */
    __publicField(this, "currentFrame", 0);
    /** The speed that we progress through animation time (multiplies by delta time every update). Allows negatives to play in reverse. If set to 0, rAF will stop entirely so static shaders have no recurring performance costs */
    __publicField(this, "speed", 0);
    /** Actual speed used that accounts for visibility: we pause the shader if the tab is hidden or the element out of the viewport */
    __publicField(this, "currentSpeed", 0);
    /** Uniforms that are provided by the user for the specific shader being mounted (not including uniforms that this Mount adds, like time and resolution) */
    __publicField(this, "providedUniforms");
    /** Names of the uniforms that should have mipmaps generated for them */
    __publicField(this, "mipmaps", []);
    /** Just a sanity check to make sure frames don't run after we're disposed */
    __publicField(this, "hasBeenDisposed", false);
    /** If the resolution of the canvas has changed since the last render */
    __publicField(this, "resolutionChanged", true);
    /** Store textures that are provided by the user */
    __publicField(this, "textures", /* @__PURE__ */ new Map());
    __publicField(this, "minPixelRatio");
    __publicField(this, "maxPixelCount");
    __publicField(this, "isSafari", isSafari());
    __publicField(this, "uniformCache", {});
    __publicField(this, "textureUnitMap", /* @__PURE__ */ new Map());
    __publicField(this, "ownerDocument");
    __publicField(this, "initProgram", () => {
      const program = createProgram(this.gl, vertexShaderSource, this.fragmentShader);
      if (!program) return;
      this.program = program;
      this.gl.useProgram(program);
    });
    __publicField(this, "setupPositionAttribute", () => {
      const positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
      const positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
      const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
      this.gl.enableVertexAttribArray(positionAttributeLocation);
      this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    });
    __publicField(this, "setupUniforms", () => {
      const uniformLocations = {
        u_time: this.gl.getUniformLocation(this.program, "u_time"),
        u_pixelRatio: this.gl.getUniformLocation(this.program, "u_pixelRatio"),
        u_resolution: this.gl.getUniformLocation(this.program, "u_resolution")
      };
      Object.entries(this.providedUniforms).forEach(([key, value]) => {
        uniformLocations[key] = this.gl.getUniformLocation(this.program, key);
        if (value instanceof HTMLImageElement) {
          const aspectRatioUniformName = `${key}AspectRatio`;
          uniformLocations[aspectRatioUniformName] = this.gl.getUniformLocation(this.program, aspectRatioUniformName);
        }
      });
      this.uniformLocations = uniformLocations;
    });
    /**
     * The scale that we should render at.
     * - Used to target 2x rendering even on 1x screens for better antialiasing
     * - Prevents the virtual resolution from going beyond the maximum resolution
     * - Accounts for the page zoom level so we render in physical device pixels rather than CSS pixels
     */
    __publicField(this, "renderScale", 1);
    __publicField(this, "parentWidth", 0);
    __publicField(this, "parentHeight", 0);
    __publicField(this, "parentDevicePixelWidth", 0);
    __publicField(this, "parentDevicePixelHeight", 0);
    __publicField(this, "devicePixelsSupported", false);
    __publicField(this, "intersectionObserver", null);
    __publicField(this, "isInViewport", true);
    __publicField(this, "resizeObserver", null);
    __publicField(this, "setupResizeObserver", () => {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        if (entry?.borderBoxSize[0]) {
          const physicalPixelSize = entry.devicePixelContentBoxSize?.[0];
          if (physicalPixelSize !== void 0) {
            this.devicePixelsSupported = true;
            this.parentDevicePixelWidth = physicalPixelSize.inlineSize;
            this.parentDevicePixelHeight = physicalPixelSize.blockSize;
          }
          this.parentWidth = entry.borderBoxSize[0].inlineSize;
          this.parentHeight = entry.borderBoxSize[0].blockSize;
        }
        this.handleResize();
      });
      this.resizeObserver.observe(this.parentElement);
    });
    __publicField(this, "setupIntersectionObserver", () => {
      const view = this.ownerDocument.defaultView;
      if (!view?.IntersectionObserver) return;
      this.intersectionObserver = new view.IntersectionObserver(([entry]) => {
        this.isInViewport = entry?.isIntersecting ?? true;
        this.updateCurrentSpeed();
      });
      this.intersectionObserver.observe(this.parentElement);
    });
    // Visual viewport resize handler, mainly used to react to browser zoom changes.
    // Resize observer by itself does not react to pinch zoom, and although it usually
    // reacts to classic browser zoom, it's not guaranteed in edge cases.
    // Since timing between visual viewport changes and resize observer is complex
    // and because we'd like to know the device pixel sizes of elements, we just restart
    // the observer to get a guaranteed fresh callback regardless if it would have triggered or not.
    __publicField(this, "handleVisualViewportChange", () => {
      this.resizeObserver?.disconnect();
      this.setupResizeObserver();
    });
    /** Resize handler for when the container div changes size or the max pixel count changes and we want to resize our canvas to match */
    __publicField(this, "handleResize", () => {
      let targetPixelWidth = 0;
      let targetPixelHeight = 0;
      const dpr = Math.max(1, window.devicePixelRatio);
      const pinchZoom = visualViewport?.scale ?? 1;
      if (this.devicePixelsSupported) {
        const scaleToMeetMinPixelRatio = Math.max(1, this.minPixelRatio / dpr);
        targetPixelWidth = this.parentDevicePixelWidth * scaleToMeetMinPixelRatio * pinchZoom;
        targetPixelHeight = this.parentDevicePixelHeight * scaleToMeetMinPixelRatio * pinchZoom;
      } else {
        let targetRenderScale = Math.max(dpr, this.minPixelRatio) * pinchZoom;
        if (this.isSafari) {
          const zoomLevel = bestGuessBrowserZoom(this.ownerDocument);
          targetRenderScale *= Math.max(1, zoomLevel);
        }
        targetPixelWidth = Math.round(this.parentWidth) * targetRenderScale;
        targetPixelHeight = Math.round(this.parentHeight) * targetRenderScale;
      }
      const maxPixelCountHeadroom = Math.sqrt(this.maxPixelCount) / Math.sqrt(targetPixelWidth * targetPixelHeight);
      const scaleToMeetMaxPixelCount = Math.min(1, maxPixelCountHeadroom);
      const newWidth = Math.round(targetPixelWidth * scaleToMeetMaxPixelCount);
      const newHeight = Math.round(targetPixelHeight * scaleToMeetMaxPixelCount);
      const newRenderScale = newWidth / Math.round(this.parentWidth);
      if (this.canvasElement.width !== newWidth || this.canvasElement.height !== newHeight || this.renderScale !== newRenderScale) {
        this.renderScale = newRenderScale;
        this.canvasElement.width = newWidth;
        this.canvasElement.height = newHeight;
        this.resolutionChanged = true;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.render(performance.now());
      }
    });
    __publicField(this, "render", (currentTime) => {
      if (this.hasBeenDisposed) return;
      if (this.program === null) {
        console.warn("Tried to render before program or gl was initialized");
        return;
      }
      const dt = currentTime - this.lastRenderTime;
      this.lastRenderTime = currentTime;
      if (this.currentSpeed !== 0) {
        this.currentFrame += dt * this.currentSpeed;
      }
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.uniform1f(this.uniformLocations.u_time, this.currentFrame * 1e-3);
      if (this.resolutionChanged) {
        this.gl.uniform2f(this.uniformLocations.u_resolution, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform1f(this.uniformLocations.u_pixelRatio, this.renderScale);
        this.resolutionChanged = false;
      }
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      if (this.currentSpeed !== 0) {
        this.requestRender();
      } else {
        this.rafId = null;
      }
    });
    __publicField(this, "requestRender", () => {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = requestAnimationFrame(this.render);
    });
    /** Creates a texture from an image and sets it into a uniform value */
    __publicField(this, "setTextureUniform", (uniformName, image) => {
      if (!image.complete || image.naturalWidth === 0) {
        throw new Error(`Paper Shaders: image for uniform ${uniformName} must be fully loaded`);
      }
      const existingTexture = this.textures.get(uniformName);
      if (existingTexture) {
        this.gl.deleteTexture(existingTexture);
      }
      if (!this.textureUnitMap.has(uniformName)) {
        this.textureUnitMap.set(uniformName, this.textureUnitMap.size);
      }
      const textureUnit = this.textureUnitMap.get(uniformName);
      this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      if (this.mipmaps.includes(uniformName)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
      }
      const error = this.gl.getError();
      if (error !== this.gl.NO_ERROR || texture === null) {
        console.error("Paper Shaders: WebGL error when uploading texture:", error);
        return;
      }
      this.textures.set(uniformName, texture);
      const location = this.uniformLocations[uniformName];
      if (location) {
        this.gl.uniform1i(location, textureUnit);
        const aspectRatioUniformName = `${uniformName}AspectRatio`;
        const aspectRatioLocation = this.uniformLocations[aspectRatioUniformName];
        if (aspectRatioLocation) {
          const aspectRatio = image.naturalWidth / image.naturalHeight;
          this.gl.uniform1f(aspectRatioLocation, aspectRatio);
        }
      }
    });
    /** Utility: recursive equality test for all the uniforms */
    __publicField(this, "areUniformValuesEqual", (a, b) => {
      if (a === b) return true;
      if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
        return a.every((val, i) => this.areUniformValuesEqual(val, b[i]));
      }
      return false;
    });
    /** Sets the provided uniform values into the WebGL program, can be a partial list of uniforms that have changed */
    __publicField(this, "setUniformValues", (updatedUniforms) => {
      Object.entries(updatedUniforms).forEach(([key, value]) => {
        let cacheValue = value;
        if (value instanceof HTMLImageElement) {
          cacheValue = `${value.src.slice(0, 200)}|${value.naturalWidth}x${value.naturalHeight}`;
        }
        if (this.areUniformValuesEqual(this.uniformCache[key], cacheValue)) return;
        this.uniformCache[key] = cacheValue;
        const location = this.uniformLocations[key];
        if (!location) {
          console.warn(`Uniform location for ${key} not found`);
          return;
        }
        if (value instanceof HTMLImageElement) {
          this.setTextureUniform(key, value);
        } else if (Array.isArray(value)) {
          let flatArray = null;
          let valueLength = null;
          if (value[0] !== void 0 && Array.isArray(value[0])) {
            const firstChildLength = value[0].length;
            if (value.every((arr) => arr.length === firstChildLength)) {
              flatArray = value.flat();
              valueLength = firstChildLength;
            } else {
              console.warn(`All child arrays must be the same length for ${key}`);
              return;
            }
          } else {
            flatArray = value;
            valueLength = flatArray.length;
          }
          switch (valueLength) {
            case 2:
              this.gl.uniform2fv(location, flatArray);
              break;
            case 3:
              this.gl.uniform3fv(location, flatArray);
              break;
            case 4:
              this.gl.uniform4fv(location, flatArray);
              break;
            case 9:
              this.gl.uniformMatrix3fv(location, false, flatArray);
              break;
            case 16:
              this.gl.uniformMatrix4fv(location, false, flatArray);
              break;
            default:
              console.warn(`Unsupported uniform array length: ${valueLength}`);
          }
        } else if (typeof value === "number") {
          this.gl.uniform1f(location, value);
        } else if (typeof value === "boolean") {
          this.gl.uniform1i(location, value ? 1 : 0);
        } else {
          console.warn(`Unsupported uniform type for ${key}: ${typeof value}`);
        }
      });
    });
    /** Gets the current total animation time from 0ms */
    __publicField(this, "getCurrentFrame", () => {
      return this.currentFrame;
    });
    /** Set a frame to get a deterministic result, frames are literally just milliseconds from zero since the animation started */
    __publicField(this, "setFrame", (newFrame) => {
      this.currentFrame = newFrame;
      this.lastRenderTime = performance.now();
      this.renderUnlessAnimating();
    });
    /** Set an animation speed (or 0 to stop animation) */
    __publicField(this, "setSpeed", (newSpeed = 1) => {
      this.speed = newSpeed;
      this.updateCurrentSpeed();
    });
    /** Apply the target speed, pausing (0) while the tab is hidden or the element is out of the viewport */
    __publicField(this, "updateCurrentSpeed", () => {
      this.setCurrentSpeed(this.ownerDocument.hidden || !this.isInViewport ? 0 : this.speed);
    });
    __publicField(this, "setCurrentSpeed", (newSpeed) => {
      this.currentSpeed = newSpeed;
      if (this.rafId === null && newSpeed !== 0) {
        this.lastRenderTime = performance.now();
        this.rafId = requestAnimationFrame(this.render);
      }
      if (this.rafId !== null && newSpeed === 0) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    });
    /** Set the maximum pixel count for the shader, this will limit the number of pixels that will be rendered */
    __publicField(this, "setMaxPixelCount", (newMaxPixelCount = DEFAULT_MAX_PIXEL_COUNT) => {
      this.maxPixelCount = newMaxPixelCount;
      this.handleResize();
    });
    /** Set the minimum pixel ratio for the shader */
    __publicField(this, "setMinPixelRatio", (newMinPixelRatio = 2) => {
      this.minPixelRatio = newMinPixelRatio;
      this.handleResize();
    });
    /** Update the uniforms that are provided by the outside shader, can be a partial set with only the uniforms that have changed */
    __publicField(this, "setUniforms", (newUniforms) => {
      this.setUniformValues(newUniforms);
      this.providedUniforms = { ...this.providedUniforms, ...newUniforms };
      this.renderUnlessAnimating();
    });
    /** Render right away only when the rAF loop isn't running */
    __publicField(this, "renderUnlessAnimating", () => {
      if (this.rafId === null) {
        this.render(performance.now());
      }
    });
    __publicField(this, "handleDocumentVisibilityChange", () => {
      this.updateCurrentSpeed();
    });
    /** Dispose of the shader mount, cleaning up all of the WebGL resources */
    __publicField(this, "dispose", () => {
      this.hasBeenDisposed = true;
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.gl && this.program) {
        this.textures.forEach((texture) => {
          this.gl.deleteTexture(texture);
        });
        this.textures.clear();
        this.gl.deleteProgram(this.program);
        this.program = null;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.getError();
      }
      this.gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
      visualViewport?.removeEventListener("resize", this.handleVisualViewportChange);
      this.ownerDocument.removeEventListener("visibilitychange", this.handleDocumentVisibilityChange);
      this.uniformLocations = {};
      this.canvasElement.remove();
      delete this.parentElement.paperShaderMount;
    });
    if (parentElement?.nodeType === 1) {
      this.parentElement = parentElement;
    } else {
      throw new Error("Paper Shaders: parent element must be an HTMLElement");
    }
    this.ownerDocument = parentElement.ownerDocument;
    if (!this.ownerDocument.querySelector("style[data-paper-shader]")) {
      const styleElement = this.ownerDocument.createElement("style");
      styleElement.innerHTML = defaultStyle;
      styleElement.setAttribute("data-paper-shader", "");
      this.ownerDocument.head.prepend(styleElement);
    }
    const canvasElement = this.ownerDocument.createElement("canvas");
    this.canvasElement = canvasElement;
    this.parentElement.prepend(canvasElement);
    this.fragmentShader = fragmentShader;
    this.providedUniforms = uniforms;
    this.mipmaps = mipmaps;
    this.currentFrame = frame;
    this.minPixelRatio = minPixelRatio;
    this.maxPixelCount = maxPixelCount;
    const gl = canvasElement.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      ...webGlContextAttributes
    });
    if (!gl) {
      throw new Error("Paper Shaders: WebGL is not supported in this browser");
    }
    this.gl = gl;
    this.initProgram();
    this.setupPositionAttribute();
    this.setupUniforms();
    this.setUniformValues(this.providedUniforms);
    this.setupResizeObserver();
    visualViewport?.addEventListener("resize", this.handleVisualViewportChange);
    this.setupIntersectionObserver();
    this.setSpeed(speed);
    this.parentElement.setAttribute("data-paper-shader", "");
    this.parentElement.paperShaderMount = this;
    this.ownerDocument.addEventListener("visibilitychange", this.handleDocumentVisibilityChange);
  }
};
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function createProgram(gl, vertexShaderSource2, fragmentShaderSource) {
  const format = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
  const precision = format ? format.precision : null;
  if (precision && precision < 23) {
    vertexShaderSource2 = vertexShaderSource2.replace(/precision\s+(lowp|mediump)\s+float;/g, "precision highp float;");
    fragmentShaderSource = fragmentShaderSource.replace(/precision\s+(lowp|mediump)\s+float/g, "precision highp float").replace(/\b(uniform|varying|attribute)\s+(lowp|mediump)\s+(\w+)/g, "$1 highp $3");
  }
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource2);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}
var defaultStyle = `@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;

    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;
function isSafari() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android");
}
function bestGuessBrowserZoom(doc) {
  const viewportScale = visualViewport?.scale ?? 1;
  const viewportWidth = visualViewport?.width ?? window.innerWidth;
  const scrollbarWidth = window.innerWidth - doc.documentElement.clientWidth;
  const innerWidth = viewportScale * viewportWidth + scrollbarWidth;
  const ratio = outerWidth / innerWidth;
  const zoomPercentageRounded = Math.round(100 * ratio);
  if (zoomPercentageRounded % 5 === 0) {
    return zoomPercentageRounded / 100;
  }
  if (zoomPercentageRounded === 33) {
    return 1 / 3;
  }
  if (zoomPercentageRounded === 67) {
    return 2 / 3;
  }
  if (zoomPercentageRounded === 133) {
    return 4 / 3;
  }
  return ratio;
}

// node_modules/@paper-design/shaders/dist/shader-sizing.js
var ShaderFitOptions = {
  none: 0,
  contain: 1,
  cover: 2
};

// node_modules/@paper-design/shaders/dist/shader-utils.js
var declarePI = `
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`;
var proceduralHash11 = `
  float hash11(float p) {
    p = fract(p * 0.3183099) + 0.1;
    p *= p + 19.19;
    return fract(p * p);
  }
`;
var proceduralHash21 = `
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`;
var simplexNoise = `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

// node_modules/@paper-design/shaders/dist/shaders/dithering.js
var ditheringFragmentShader = `#version 300 es
precision mediump float;

uniform float u_time;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

uniform float u_pxSize;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_shape;
uniform float u_type;

out vec4 fragColor;

${simplexNoise}
${declarePI}
${proceduralHash11}
${proceduralHash21}

float getSimplexNoise(vec2 uv, float t) {
  float noise = .5 * snoise(uv - vec2(0., .3 * t));
  noise += .5 * snoise(2. * uv + vec2(0., .32 * t));

  return noise;
}

const int bayer2x2[4] = int[4](0, 2, 3, 1);
const int bayer4x4[16] = int[16](
0, 8, 2, 10,
12, 4, 14, 6,
3, 11, 1, 9,
15, 7, 13, 5
);

const int bayer8x8[64] = int[64](
0, 32, 8, 40, 2, 34, 10, 42,
48, 16, 56, 24, 50, 18, 58, 26,
12, 44, 4, 36, 14, 46, 6, 38,
60, 28, 52, 20, 62, 30, 54, 22,
3, 35, 11, 43, 1, 33, 9, 41,
51, 19, 59, 27, 49, 17, 57, 25,
15, 47, 7, 39, 13, 45, 5, 37,
63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv, int size) {
  ivec2 pos = ivec2(fract(uv / float(size)) * float(size));
  int index = pos.y * size + pos.x;

  if (size == 2) {
    return float(bayer2x2[index]) / 4.0;
  } else if (size == 4) {
    return float(bayer4x4[index]) / 16.0;
  } else if (size == 8) {
    return float(bayer8x8[index]) / 64.0;
  }
  return 0.0;
}


void main() {
  float t = .5 * u_time;

  float pxSize = u_pxSize * u_pixelRatio;
  vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
  pxSizeUV /= pxSize;
  vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
  vec2 normalizedUV = canvasPixelizedUV / u_resolution;

  vec2 ditheringNoiseUV = canvasPixelizedUV;
  vec2 shapeUV = normalizedUV;

  vec2 boxOrigin = vec2(.5 - u_originX, u_originY - .5);
  vec2 givenBoxSize = vec2(u_worldWidth, u_worldHeight);
  givenBoxSize = max(givenBoxSize, vec2(1.)) * u_pixelRatio;
  float r = u_rotation * PI / 180.;
  mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

  float patternBoxRatio = givenBoxSize.x / givenBoxSize.y;
  vec2 boxSize = vec2(
  (u_worldWidth == 0.) ? u_resolution.x : givenBoxSize.x,
  (u_worldHeight == 0.) ? u_resolution.y : givenBoxSize.y
  );
  
  if (u_shape > 3.5) {
    vec2 objectBoxSize = vec2(0.);
    // fit = none
    objectBoxSize.x = min(boxSize.x, boxSize.y);
    if (u_fit == 1.) { // fit = contain
      objectBoxSize.x = min(u_resolution.x, u_resolution.y);
    } else if (u_fit == 2.) { // fit = cover
      objectBoxSize.x = max(u_resolution.x, u_resolution.y);
    }
    objectBoxSize.y = objectBoxSize.x;
    vec2 objectWorldScale = u_resolution.xy / objectBoxSize;

    shapeUV *= objectWorldScale;
    shapeUV += boxOrigin * (objectWorldScale - 1.);
    shapeUV += vec2(-u_offsetX, u_offsetY);
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
  } else {
    vec2 patternBoxSize = vec2(0.);
    // fit = none
    patternBoxSize.x = patternBoxRatio * min(boxSize.x / patternBoxRatio, boxSize.y);
    float patternWorldNoFitBoxWidth = patternBoxSize.x;
    if (u_fit == 1.) { // fit = contain
      patternBoxSize.x = patternBoxRatio * min(u_resolution.x / patternBoxRatio, u_resolution.y);
    } else if (u_fit == 2.) { // fit = cover
      patternBoxSize.x = patternBoxRatio * max(u_resolution.x / patternBoxRatio, u_resolution.y);
    }
    patternBoxSize.y = patternBoxSize.x / patternBoxRatio;
    vec2 patternWorldScale = u_resolution.xy / patternBoxSize;

    shapeUV += vec2(-u_offsetX, u_offsetY) / patternWorldScale;
    shapeUV += boxOrigin;
    shapeUV -= boxOrigin / patternWorldScale;
    shapeUV *= u_resolution.xy;
    shapeUV /= u_pixelRatio;
    if (u_fit > 0.) {
      shapeUV *= (patternWorldNoFitBoxWidth / patternBoxSize.x);
    }
    shapeUV /= u_scale;
    shapeUV = graphicRotation * shapeUV;
    shapeUV += boxOrigin / patternWorldScale;
    shapeUV -= boxOrigin;
    shapeUV += .5;
  }

  float shape = 0.;
  if (u_shape < 1.5) {
    // Simplex noise
    shapeUV *= .001;

    shape = 0.5 + 0.5 * getSimplexNoise(shapeUV, t);
    shape = smoothstep(0.3, 0.9, shape);

  } else if (u_shape < 2.5) {
    // Warp
    shapeUV *= .003;

    for (float i = 1.0; i < 6.0; i++) {
      shapeUV.x += 0.6 / i * cos(i * 2.5 * shapeUV.y + t);
      shapeUV.y += 0.6 / i * cos(i * 1.5 * shapeUV.x + t);
    }

    shape = .15 / max(0.001, abs(sin(t - shapeUV.y - shapeUV.x)));
    shape = smoothstep(0.02, 1., shape);

  } else if (u_shape < 3.5) {
    // Dots
    shapeUV *= .05;

    float stripeIdx = floor(2. * shapeUV.x / TWO_PI);
    float rand = hash11(stripeIdx * 10.);
    rand = sign(rand - .5) * pow(.1 + abs(rand), .4);
    shape = sin(shapeUV.x) * cos(shapeUV.y - 5. * rand * t);
    shape = pow(abs(shape), 6.);

  } else if (u_shape < 4.5) {
    // Sine wave
    shapeUV *= 4.;

    float wave = cos(.5 * shapeUV.x - 2. * t) * sin(1.5 * shapeUV.x + t) * (.75 + .25 * cos(3. * t));
    shape = 1. - smoothstep(-1., 1., shapeUV.y + wave);

  } else if (u_shape < 5.5) {
    // Ripple

    float dist = length(shapeUV);
    float waves = sin(pow(dist, 1.7) * 7. - 3. * t) * .5 + .5;
    shape = waves;

  } else if (u_shape < 6.5) {
    // Swirl

    float l = length(shapeUV);
    float angle = 6. * atan(shapeUV.y, shapeUV.x) + 4. * t;
    float twist = 1.2;
    float offset = 1. / pow(max(l, 1e-6), twist) + angle / TWO_PI;
    float mid = smoothstep(0., 1., pow(l, twist));
    shape = mix(0., fract(offset), mid);

  } else {
    // Sphere
    shapeUV *= 2.;

    float d = 1. - pow(length(shapeUV), 2.);
    vec3 pos = vec3(shapeUV, sqrt(max(0., d)));
    vec3 lightPos = normalize(vec3(cos(1.5 * t), .8, sin(1.25 * t)));
    shape = .5 + .5 * dot(lightPos, pos);
    shape *= step(0., d);
  }


  int type = int(floor(u_type));
  float dithering = 0.0;

  switch (type) {
    case 1: {
      dithering = step(hash21(ditheringNoiseUV), shape);
    } break;
    case 2:
    dithering = getBayerValue(pxSizeUV, 2);
    break;
    case 3:
    dithering = getBayerValue(pxSizeUV, 4);
    break;
    default :
    dithering = getBayerValue(pxSizeUV, 8);
    break;
  }

  dithering -= .5;
  float res = step(.5, shape + dithering);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3 color = fgColor * res;
  float opacity = fgOpacity * res;

  color += bgColor * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`;
var DitheringShapes = {
  simplex: 1,
  warp: 2,
  dots: 3,
  wave: 4,
  ripple: 5,
  swirl: 6,
  sphere: 7
};
var DitheringTypes = {
  "random": 1,
  "2x2": 2,
  "4x4": 3,
  "8x8": 4
};

// node_modules/@paper-design/shaders/dist/get-shader-color-from-string.js
function getShaderColorFromString(colorString) {
  if (Array.isArray(colorString)) {
    if (colorString.length === 4) return colorString;
    if (colorString.length === 3) return [...colorString, 1];
    return fallbackColor;
  }
  if (typeof colorString !== "string") {
    return fallbackColor;
  }
  let r, g, b, a = 1;
  if (colorString.startsWith("#")) {
    [r, g, b, a] = hexToRgba(colorString);
  } else if (colorString.startsWith("rgb")) {
    const rgba = parseRgba(colorString);
    if (rgba === null) return fallbackColor;
    [r, g, b, a] = rgba;
  } else if (colorString.startsWith("hsl")) {
    const hsla = parseHsla(colorString);
    if (hsla === null) return fallbackColor;
    [r, g, b, a] = hslaToRgba(hsla);
  } else {
    console.error("Unsupported color format", colorString);
    return fallbackColor;
  }
  return [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1), clamp(a, 0, 1)];
}
function hexToRgba(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((char) => char + char).join("");
  }
  if (hex.length === 6) {
    hex = hex + "ff";
  }
  if (!/^[0-9a-f]{8}$/i.test(hex)) {
    console.warn("Invalid hex color");
    return fallbackColor;
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = parseInt(hex.slice(6, 8), 16) / 255;
  return [r, g, b, a];
}
function parseRgba(rgba) {
  const match = rgba.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (!match) return null;
  return [
    parseInt(match[1] ?? "0") / 255,
    parseInt(match[2] ?? "0") / 255,
    parseInt(match[3] ?? "0") / 255,
    match[4] === void 0 ? 1 : parseFloat(match[4])
  ];
}
function parseHsla(hsla) {
  const match = hsla.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([0-9.]+))?\s*\)$/i);
  if (!match) return null;
  return [
    parseInt(match[1] ?? "0"),
    parseInt(match[2] ?? "0"),
    parseInt(match[3] ?? "0"),
    match[4] === void 0 ? 1 : parseFloat(match[4])
  ];
}
function hslaToRgba(hsla) {
  const [h, s, l, a] = hsla;
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p2, q2, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2) return q2;
      if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }
  return [r, g, b, a];
}
var clamp = (n, min, max) => Math.min(Math.max(n, min), max);
var fallbackColor = [0.5, 0.5, 0.5, 1];
export {
  DitheringShapes,
  DitheringTypes,
  ShaderFitOptions,
  ShaderMount,
  ditheringFragmentShader,
  getShaderColorFromString
};
