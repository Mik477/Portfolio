// src/lib/three/contactRaymarching.glsl
// This file contains the complete fragment shader logic for the contact section's raymarching effect.

// Uniforms (inputs from our Three.js material in Svelte)
uniform float uTime;
uniform vec2 uResolution;
uniform int uSphereCount;
uniform float uAmbientIntensity;
uniform float uDiffuseIntensity;
uniform float uSpecularIntensity;
uniform float uSpecularPower;
uniform float uFresnelPower;
uniform vec3 uBackgroundColor;
uniform vec3 uSphereColor;
uniform vec3 uLightColor;
uniform vec3 uLightPosition;
uniform float uSmoothness;
uniform float uContrast;
uniform float uFogDensity;
uniform float uAnimationSpeed;
uniform float uCameraDistance;
uniform int uMovementPattern;
uniform float uMovementSpeed;
uniform float uMovementScale;
uniform bool uIndividualRotation;
uniform vec2 uMousePosition;
uniform bool uMouseProximityEffect;
uniform float uMinMovementScale;
uniform float uMaxMovementScale;

// Varyings (data passed from the vertex shader)
in vec2 vUv;

// Output color for the fragment
out vec4 fragColor;

// Constants
const float PI = 3.14159265359;
const float EPSILON = 0.0001;
const int MAX_STEPS = 100;
const float MAX_DIST = 100.0;

// --- Helper Functions ---

// Signed Distance Function for a sphere
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

// Smooth minimum function for blending shapes
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Rotation matrix around the Y axis
mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    c, 0, s,
    0, 1, 0,
    -s, 0, c
  );
}

// Rotation matrix around the X axis
mat3 rotateX(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    1, 0, 0,
    0, c, -s,
    0, s, c
  );
}

// Rotation matrix around the Z axis
mat3 rotateZ(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    c, -s, 0,
    s, c, 0,
    0, 0, 1
  );
}

// Calculate distance to center for mouse proximity effect
float getDistanceToCenter(vec2 pos) {
  float dist = length(pos - vec2(0.5, 0.5)) * 2.0; // Normalized 0-1
  return smoothstep(0.0, 1.0, dist);
}

// The main Signed Distance Function for the entire scene
float sdf(vec3 pos) {
  float result = MAX_DIST;
  float t = uTime * uMovementSpeed;
  
  float dynamicMovementScale = uMovementScale;
  if (uMouseProximityEffect) {
    float distToCenter = getDistanceToCenter(uMousePosition);
    float t_mouse = smoothstep(0.0, 1.0, distToCenter);
    dynamicMovementScale = mix(uMinMovementScale, uMaxMovementScale, t_mouse);
  }
  
  for (int i = 0; i < 10; i++) {
    if (i >= uSphereCount) break;
    
    float speed = 0.5 + float(i) * 0.1;
    float radius = 0.15 + float(i % 3) * 0.1;
    float orbitRadius = (0.5 + float(i % 5) * 0.2) * dynamicMovementScale;
    float phaseOffset = float(i) * PI * 0.2;
    
    vec3 offset;
    
    if (i == 0) {
      offset = vec3(
        sin(t * speed) * orbitRadius * 0.5,
        sin(t * 0.5) * orbitRadius,
        cos(t * speed * 0.7) * orbitRadius * 0.5
      );
    } 
    else if (i == 1) {
      offset = vec3(
        sin(t * speed + PI) * orbitRadius * 0.5,
        -sin(t * 0.5) * orbitRadius,
        cos(t * speed * 0.7 + PI) * orbitRadius * 0.5
      );
    }
    else if (uMovementPattern == 0) { // Orbital
      offset = vec3(
        sin(t * speed + phaseOffset) * orbitRadius,
        cos(t * (speed * 0.7) + phaseOffset * 1.3) * (orbitRadius * 0.6),
        sin(t * (speed * 0.5) + phaseOffset * 0.9) * (orbitRadius * 0.8)
      );
    } 
    else if (uMovementPattern == 1) { // Wave
      float wave = sin(t * 0.5) * 0.5;
      offset = vec3(
        sin(t * 0.2 + float(i) * 0.5) * orbitRadius,
        sin(t * 0.3 + float(i) * 0.7 + wave) * orbitRadius * 0.5,
        cos(t * 0.4 + float(i) * 0.6) * orbitRadius * 0.7
      );
    }
    else if (uMovementPattern == 2) { // Chaos
      offset = vec3(
        sin(t * speed * 1.1 + sin(t * 0.4) * 2.0) * orbitRadius,
        cos(t * speed * 0.9 + sin(t * 0.5) * 1.5) * orbitRadius * 0.8,
        sin(t * speed * 0.7 + sin(t * 0.6) * 1.8) * orbitRadius * 0.6
      );
    }
    else { // Pulse
      float pulse = (sin(t * 0.8) * 0.5 + 0.5) * 0.5 + 0.5;
      offset = vec3(
        sin(t * speed + phaseOffset) * orbitRadius * pulse,
        cos(t * (speed * 0.7) + phaseOffset * 1.3) * (orbitRadius * 0.6) * pulse,
        sin(t * (speed * 0.5) + phaseOffset * 0.9) * (orbitRadius * 0.8) * pulse
      );
    }
    
    if (uIndividualRotation) {
      float rotSpeed = t * (0.2 + float(i) * 0.05);
      mat3 rot = rotateY(rotSpeed) * rotateX(rotSpeed * 0.7);
      offset = rot * offset;
    }
    
    float sphere = sdSphere(pos + offset, radius);
    result = smin(result, sphere, uSmoothness);
  }
  
  return result;
}

// Calculate the normal vector at a surface point
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(EPSILON, 0.0);
  return normalize(vec3(
    sdf(p + e.xyy) - sdf(p - e.xyy),
    sdf(p + e.yxy) - sdf(p - e.yxy),
    sdf(p + e.yyx) - sdf(p - e.yyx)
  ));
}

// The raymarching algorithm
float raymarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdf(p);
    if (d < EPSILON) return t;
    if (t > MAX_DIST) break;
    t += d * 0.8;
  }
  return -1.0;
}

// Soft shadows calculation
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float result = 1.0;
  float t = mint;
  for (int i = 0; i < 32; i++) {
    if (t >= maxt) break;
    float h = sdf(ro + rd * t);
    if (h < EPSILON) return 0.0;
    result = min(result, k * h / t);
    t += h;
  }
  return result;
}

// Ambient occlusion calculation
float ambientOcclusion(vec3 p, vec3 n) {
  float occ = 0.0;
  float weight = 1.0;
  for (int i = 0; i < 5; i++) {
    float dist = 0.01 + 0.02 * float(i * i);
    float h = sdf(p + n * dist);
    occ += (dist - h) * weight;
    weight *= 0.85;
  }
  return clamp(1.0 - occ, 0.0, 1.0);
}

// Main lighting calculation
vec3 lighting(vec3 p, vec3 rd, float t) {
  if (t < 0.0) return vec3(0.0);
  
  vec3 normal = calcNormal(p);
  vec3 viewDir = -rd;
  
  vec3 baseColor = uSphereColor;
  vec3 ambient = baseColor * uAmbientIntensity;
  
  vec3 lightDir = normalize(uLightPosition);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = baseColor * uLightColor * diff * uDiffuseIntensity;
  
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
  vec3 specular = uLightColor * spec * uSpecularIntensity;
  
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
  specular *= fresnel;
  
  float ao = ambientOcclusion(p, normal);
  float shadow = softShadow(p, lightDir, 0.01, 10.0, 16.0);
  
  vec3 color = ambient * ao + (diffuse * shadow + specular) * ao;
  color = pow(color, vec3(uContrast));
  
  return color;
}


// --- Main Shader Program Entry Point ---

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
  
  vec3 ro = vec3(0.0, 0.0, -uCameraDistance);
  vec3 rd = normalize(vec3(uv, 1.0));
  
  float camRotY = sin(uTime * 0.1) * 0.1;
  float camRotX = cos(uTime * 0.08) * 0.05;
  rd = rotateY(camRotY) * rotateX(camRotX) * rd;
  
  float t = raymarch(ro, rd);
  vec3 p = ro + rd * t;
  vec3 color = lighting(p, rd, t);
  
  if (t > 0.0) {
    float fogAmount = 1.0 - exp(-t * uFogDensity);
    color = mix(color, uBackgroundColor, fogAmount);
    fragColor = vec4(color, 1.0);
  } else {
    // This provides the transparent background for our effect.
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}