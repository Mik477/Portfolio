//version 300 es
precision highp float;
precision highp int;

/* contactRaymarching_fixed.glsl
   Improvements:
   - Correct smooth-min (Inigo Quilez version, no distortion term)
   - Normals blended alongside distance for smooth shading at junctions
   - Slightly larger NORMAL_EPS for stable gradients
*/

#ifndef MAX_SPHERES
  #define MAX_SPHERES 12
#endif
#ifndef MAX_STEPS
  #define MAX_STEPS 96
#endif
#define MAX_SPHERES4 (MAX_SPHERES * 4)
#define SHADOW_STEPS 16

out vec4 fragColor;
in vec2 vUv;

/* Uniforms */
uniform float uTime;
uniform vec2  uResolution;

uniform int   uSphereCount;
uniform float uSpheres[MAX_SPHERES4];

uniform vec3  uSphereColor;
uniform vec3  uLightColor;
uniform vec3  uLightPosition;

uniform float uAmbientIntensity;
uniform float uDiffuseIntensity;
uniform float uSpecularIntensity;
uniform float uFresnelPower;
uniform float uSpecularPower;
uniform float uContrast;
uniform vec3  uBackgroundColor;
uniform float uFogDensity;
uniform float uCameraDistance;
uniform int   uMaxSteps;

uniform float uSmoothness;

/* Constants */
const float PI = 3.141592653589793;
const float EPSILON = 0.0001;
const float NORMAL_EPS = 0.002;   // larger epsilon for stable normals
const float HIT_EPS = 0.0025;
const float STEP_SCALE = 0.92;
const float MIN_STEP = 0.0005;
const float MAX_DIST = 100.0;

/* Data struct for returning both distance and normal */
struct SDFResult {
  float dist;
  vec3 normal;
};

/* Helpers */
vec4 sphereAt(int i) {
  int b = i * 4;
  return vec4(uSpheres[b], uSpheres[b + 1], uSpheres[b + 2], uSpheres[b + 3]);
}

SDFResult sdSphere(vec3 p, vec4 s) {
  vec3 q = p - s.xyz;
  float d = length(q) - s.w;
  return SDFResult(d, normalize(q));
}

/* Canonical smooth min (Inigo Quilez) with normal blending */
SDFResult sminBlend(SDFResult a, SDFResult b, float k) {
  float h = clamp(0.5 + 0.5 * (b.dist - a.dist) / k, 0.0, 1.0);
  float d = mix(b.dist, a.dist, h) - k * h * (1.0 - h);
  vec3 n = normalize(mix(b.normal, a.normal, h));
  return SDFResult(d, n);
}

/* Scene SDF */
SDFResult sdf(vec3 p) {
  SDFResult res;
  res.dist = MAX_DIST;
  res.normal = vec3(0.0, 1.0, 0.0);

  for (int i = 0; i < MAX_SPHERES; ++i) {
    if (i >= uSphereCount) break;
    vec4 s = sphereAt(i);
    if (s.w <= 0.0) continue;

    SDFResult sphere = sdSphere(p, s);
    res = sminBlend(res, sphere, uSmoothness);

    if (res.dist < -0.5 * uSmoothness) break;
  }
  return res;
}

/* Normal calculation: fall back to finite difference if needed */
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(NORMAL_EPS, 0.0);
  return normalize(vec3(
    sdf(p + e.xyy).dist - sdf(p - e.xyy).dist,
    sdf(p + e.yxy).dist - sdf(p - e.yxy).dist,
    sdf(p + e.yyx).dist - sdf(p - e.yyx).dist
  ));
}

/* Ambient Occlusion */
float ambientOcclusion(vec3 p, vec3 n) {
  float occ = 0.0;
  float weight = 1.0;
  for (int i = 0; i < 5; ++i) {
    float dist = 0.01 + 0.02 * float(i * i);
    float h = sdf(p + n * dist).dist;
    occ += (dist - h) * weight;
    weight *= 0.85;
  }
  return clamp(1.0 - occ, 0.0, 1.0);
}

/* Soft shadow */
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < SHADOW_STEPS; ++i) {
    if (t >= maxt) break;
    float h = sdf(ro + rd * t).dist;
    if (h < EPSILON) return 0.0;
    res = min(res, k * h / t);
    t += h;
  }
  return clamp(res, 0.0, 1.0);
}

/* Raymarch */
float raymarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; ++i) {
    if (i >= uMaxSteps) break;
    vec3 p = ro + rd * t;
    float d = sdf(p).dist;
    if (d < HIT_EPS) return t;
    float step = max(d * STEP_SCALE, MIN_STEP);
    t += step;
    if (t > MAX_DIST) break;
  }
  return -1.0;
}

/* Lighting (Phong + Fresnel + soft shadows) */
vec3 lighting(vec3 p, vec3 rd, float tHit) {
  if (tHit < 0.0) return vec3(0.0);

  SDFResult res = sdf(p);
  vec3 normal = res.normal;  // use blended normal
  vec3 viewDir = normalize(-rd);

  vec3 baseColor = uSphereColor;
  vec3 ambient = baseColor * uAmbientIntensity;

  vec3 lightDir = normalize(uLightPosition);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = baseColor * uLightColor * diff * uDiffuseIntensity;

  vec3 reflectDir = reflect(-lightDir, normal);
  float specAngle = max(dot(viewDir, reflectDir), 0.0);
  float spec = pow(specAngle, max(1.0, uSpecularPower));
  vec3 specular = uLightColor * spec * uSpecularIntensity;

  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
  specular *= fresnel;

  float ao = ambientOcclusion(p, normal);
  float shadow = softShadow(p + normal * HIT_EPS * 3.0, lightDir, 0.01, 10.0, 16.0);

  vec3 color = ambient * ao + (diffuse * shadow + specular) * ao;
  color = pow(color, vec3(uContrast));
  return color;
}

/* Camera / ray */
vec3 makeRay(vec2 uv) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= uResolution.x / uResolution.y;
  vec3 rd = normalize(vec3(p, 1.0));

  float camRotY = sin(uTime * 0.1) * 0.1;
  float camRotX = cos(uTime * 0.08) * 0.05;

  float cY = cos(camRotY), sY = sin(camRotY);
  rd = vec3(cY * rd.x + sY * rd.z, rd.y, -sY * rd.x + cY * rd.z);

  float cX = cos(camRotX), sX = sin(camRotX);
  rd = vec3(rd.x, cX * rd.y - sX * rd.z, sX * rd.y + cX * rd.z);

  return rd;
}

void main() {
  vec3 ro = vec3(0.0, 0.0, -uCameraDistance);
  vec3 rd = makeRay(vUv);

  float t = raymarch(ro, rd);

  if (t > 0.0) {
    vec3 p = ro + rd * t;
    vec3 color = lighting(p, rd, t);

    float fogAmt = 1.0 - exp(-t * uFogDensity);
    color = mix(color, uBackgroundColor, fogAmt);

    fragColor = vec4(color, 1.0);
  } else {
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
