const r=`//version 300 es\r
precision highp float;\r
precision highp int;\r
\r
/* contactRaymarching_fixed.glsl\r
   Improvements:\r
   - Correct smooth-min (Inigo Quilez version, no distortion term)\r
   - Normals blended alongside distance for smooth shading at junctions\r
   - Slightly larger NORMAL_EPS for stable gradients\r
*/\r
\r
#ifndef MAX_SPHERES\r
  #define MAX_SPHERES 12\r
#endif\r
#ifndef MAX_STEPS\r
  #define MAX_STEPS 96\r
#endif\r
#define MAX_SPHERES4 (MAX_SPHERES * 4)\r
#define SHADOW_STEPS 16\r
\r
out vec4 fragColor;\r
in vec2 vUv;\r
\r
/* Uniforms */\r
uniform float uTime;\r
uniform vec2  uResolution;\r
\r
uniform int   uSphereCount;\r
uniform float uSpheres[MAX_SPHERES4];\r
\r
uniform vec3  uSphereColor;\r
uniform vec3  uLightColor;\r
uniform vec3  uLightPosition;\r
\r
uniform float uAmbientIntensity;\r
uniform float uDiffuseIntensity;\r
uniform float uSpecularIntensity;\r
uniform float uFresnelPower;\r
uniform float uSpecularPower;\r
uniform float uContrast;\r
uniform vec3  uBackgroundColor;\r
uniform float uFogDensity;\r
uniform float uCameraDistance;\r
uniform int   uMaxSteps;\r
\r
uniform float uSmoothness;\r
\r
/* Constants */\r
const float PI = 3.141592653589793;\r
const float EPSILON = 0.0001;\r
const float NORMAL_EPS = 0.002;   // larger epsilon for stable normals\r
const float HIT_EPS = 0.0025;\r
const float STEP_SCALE = 0.92;\r
const float MIN_STEP = 0.0005;\r
const float MAX_DIST = 100.0;\r
\r
/* Data struct for returning both distance and normal */\r
struct SDFResult {\r
  float dist;\r
  vec3 normal;\r
};\r
\r
/* Helpers */\r
vec4 sphereAt(int i) {\r
  int b = i * 4;\r
  return vec4(uSpheres[b], uSpheres[b + 1], uSpheres[b + 2], uSpheres[b + 3]);\r
}\r
\r
SDFResult sdSphere(vec3 p, vec4 s) {\r
  vec3 q = p - s.xyz;\r
  float d = length(q) - s.w;\r
  return SDFResult(d, normalize(q));\r
}\r
\r
/* Canonical smooth min (Inigo Quilez) with normal blending */\r
SDFResult sminBlend(SDFResult a, SDFResult b, float k) {\r
  float h = clamp(0.5 + 0.5 * (b.dist - a.dist) / k, 0.0, 1.0);\r
  float d = mix(b.dist, a.dist, h) - k * h * (1.0 - h);\r
  vec3 n = normalize(mix(b.normal, a.normal, h));\r
  return SDFResult(d, n);\r
}\r
\r
/* Scene SDF */\r
SDFResult sdf(vec3 p) {\r
  SDFResult res;\r
  res.dist = MAX_DIST;\r
  res.normal = vec3(0.0, 1.0, 0.0);\r
\r
  for (int i = 0; i < MAX_SPHERES; ++i) {\r
    if (i >= uSphereCount) break;\r
    vec4 s = sphereAt(i);\r
    if (s.w <= 0.0) continue;\r
\r
    SDFResult sphere = sdSphere(p, s);\r
    res = sminBlend(res, sphere, uSmoothness);\r
\r
    if (res.dist < -0.5 * uSmoothness) break;\r
  }\r
  return res;\r
}\r
\r
/* Normal calculation: fall back to finite difference if needed */\r
vec3 calcNormal(vec3 p) {\r
  vec2 e = vec2(NORMAL_EPS, 0.0);\r
  return normalize(vec3(\r
    sdf(p + e.xyy).dist - sdf(p - e.xyy).dist,\r
    sdf(p + e.yxy).dist - sdf(p - e.yxy).dist,\r
    sdf(p + e.yyx).dist - sdf(p - e.yyx).dist\r
  ));\r
}\r
\r
/* Ambient Occlusion */\r
float ambientOcclusion(vec3 p, vec3 n) {\r
  float occ = 0.0;\r
  float weight = 1.0;\r
  for (int i = 0; i < 5; ++i) {\r
    float dist = 0.01 + 0.02 * float(i * i);\r
    float h = sdf(p + n * dist).dist;\r
    occ += (dist - h) * weight;\r
    weight *= 0.85;\r
  }\r
  return clamp(1.0 - occ, 0.0, 1.0);\r
}\r
\r
/* Soft shadow */\r
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {\r
  float res = 1.0;\r
  float t = mint;\r
  for (int i = 0; i < SHADOW_STEPS; ++i) {\r
    if (t >= maxt) break;\r
    float h = sdf(ro + rd * t).dist;\r
    if (h < EPSILON) return 0.0;\r
    res = min(res, k * h / t);\r
    t += h;\r
  }\r
  return clamp(res, 0.0, 1.0);\r
}\r
\r
/* Raymarch */\r
float raymarch(vec3 ro, vec3 rd) {\r
  float t = 0.0;\r
  for (int i = 0; i < MAX_STEPS; ++i) {\r
    if (i >= uMaxSteps) break;\r
    vec3 p = ro + rd * t;\r
    float d = sdf(p).dist;\r
    if (d < HIT_EPS) return t;\r
    float step = max(d * STEP_SCALE, MIN_STEP);\r
    t += step;\r
    if (t > MAX_DIST) break;\r
  }\r
  return -1.0;\r
}\r
\r
/* Lighting (Phong + Fresnel + soft shadows) */\r
vec3 lighting(vec3 p, vec3 rd, float tHit) {\r
  if (tHit < 0.0) return vec3(0.0);\r
\r
  SDFResult res = sdf(p);\r
  vec3 normal = res.normal;  // use blended normal\r
  vec3 viewDir = normalize(-rd);\r
\r
  vec3 baseColor = uSphereColor;\r
  vec3 ambient = baseColor * uAmbientIntensity;\r
\r
  vec3 lightDir = normalize(uLightPosition);\r
  float diff = max(dot(normal, lightDir), 0.0);\r
  vec3 diffuse = baseColor * uLightColor * diff * uDiffuseIntensity;\r
\r
  vec3 reflectDir = reflect(-lightDir, normal);\r
  float specAngle = max(dot(viewDir, reflectDir), 0.0);\r
  float spec = pow(specAngle, max(1.0, uSpecularPower));\r
  vec3 specular = uLightColor * spec * uSpecularIntensity;\r
\r
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);\r
  specular *= fresnel;\r
\r
  float ao = ambientOcclusion(p, normal);\r
  float shadow = softShadow(p + normal * HIT_EPS * 3.0, lightDir, 0.01, 10.0, 16.0);\r
\r
  vec3 color = ambient * ao + (diffuse * shadow + specular) * ao;\r
  color = pow(color, vec3(uContrast));\r
  return color;\r
}\r
\r
/* Camera / ray */\r
vec3 makeRay(vec2 uv) {\r
  vec2 p = (uv - 0.5) * 2.0;\r
  p.x *= uResolution.x / uResolution.y;\r
  vec3 rd = normalize(vec3(p, 1.0));\r
\r
  float camRotY = sin(uTime * 0.1) * 0.1;\r
  float camRotX = cos(uTime * 0.08) * 0.05;\r
\r
  float cY = cos(camRotY), sY = sin(camRotY);\r
  rd = vec3(cY * rd.x + sY * rd.z, rd.y, -sY * rd.x + cY * rd.z);\r
\r
  float cX = cos(camRotX), sX = sin(camRotX);\r
  rd = vec3(rd.x, cX * rd.y - sX * rd.z, sX * rd.y + cX * rd.z);\r
\r
  return rd;\r
}\r
\r
void main() {\r
  vec3 ro = vec3(0.0, 0.0, -uCameraDistance);\r
  vec3 rd = makeRay(vUv);\r
\r
  float t = raymarch(ro, rd);\r
\r
  if (t > 0.0) {\r
    vec3 p = ro + rd * t;\r
    vec3 color = lighting(p, rd, t);\r
\r
    float fogAmt = 1.0 - exp(-t * uFogDensity);\r
    color = mix(color, uBackgroundColor, fogAmt);\r
\r
    fragColor = vec4(color, 1.0);\r
  } else {\r
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);\r
  }\r
}\r
`;export{r as default};
