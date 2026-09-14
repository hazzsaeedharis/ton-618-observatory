export const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform float uLens;
uniform float uDisk;
uniform float uExposure;
uniform float uShift;
uniform float uHighlight;
uniform float uBeaming;
uniform float uFov;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p) {
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
}
float fbm(vec2 p) { return .55*noise(p)+.28*noise(p*2.03)+.12*noise(p*4.07)+.05*noise(p*8.11); }
vec3 sky(vec3 d) {
 vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5, asin(clamp(d.y,-1.0,1.0))/3.1415927+.5);
 vec3 col=vec3(.0016,.0024,.0031);
 for(int j=0;j<3;j++) {
  float size=180.0+float(j)*190.0;
  vec2 p=uv*vec2(size*2.0,size), id=floor(p), f=fract(p);
  vec2 center=vec2(hash(id+9.3),hash(id+41.0))*.7+.15;
  float seed=hash(id+13.0+float(j)*19.0);
  float star=exp(-length(f-center)*length(f-center)*(900.0-float(j)*190.0));
  star*=step(.986,seed)*(.1+pow(hash(id+7.0),7.0)*2.2);
  col+=mix(vec3(.55,.68,1.0),vec3(1.0,.79,.55),hash(id+71.0))*star;
 }
 float cloud=fbm(uv*vec2(12.0,24.0));
 float band=exp(-pow((d.y+.22*d.x+.25)/.17,2.0));
 col+=vec3(.013,.014,.023)*band*pow(cloud,3.0);
 return col;
}
vec3 diskColor(vec3 p, vec3 direction) {
 float r=length(p.xz), a=atan(p.z,p.x);
 float orbital=uTime*.32/pow(r/3.0,1.5);
 // Periodic angular coordinates avoid a texture seam at +/- pi.
 vec2 flow=vec2(cos(a+orbital),sin(a+orbital));
 float wisps=fbm(vec2(r*3.6,0.0)+flow*vec2(3.0,3.0));
 float fine=sin(r*54.0+wisps*5.0+sin(a*9.0+orbital*8.0)*.8)*.5+.5;
 float bands=sin(r*15.0+wisps*3.0)*.5+.5;
 float spiral=fbm(flow*8.0+vec2(r*4.0,orbital*.4));
 float texture=.26+.50*wisps+.18*fine+.20*bands+.26*spiral;
 float inner=smoothstep(3.0,3.55,r);
 float outer=1.0-smoothstep(8.0,12.0,r);
 float falloff=pow(3.0/max(r,3.0),1.9);
 vec3 velocity=normalize(vec3(-p.z,0.0,p.x));
 float approach=dot(velocity,-normalize(direction));
 float doppler=pow(1.0+approach*.40,3.0);
 doppler=mix(1.0,doppler,uBeaming);
 vec3 warm=mix(vec3(1.0,.23,.055),vec3(1.0,.78,.48),pow(3.0/r,.65));
 warm=mix(warm,vec3(1.0,.95,.83),pow(3.0/r,3.0)*.65);
 warm=mix(warm,vec3(.63,.81,1.0),max(approach,0.0)*.10*uBeaming);
 return warm*texture*falloff*inner*outer*doppler*2.8*uDisk;
}
void main() {
 vec2 screen=(vUv-.5)*2.0;
 screen.x*=uResolution.x/uResolution.y;
 screen.x-=uShift;
 vec3 dir=normalize(uForward+screen.x*uFov*uRight+screen.y*uFov*uUp);
 vec3 p=uEye, v=dir;
 float angular=length(cross(p,v));
 float h2=angular*angular;
 // Skip the weak-field approach to keep distant cinematic views affordable.
 // Bending inside the 40-radius integration region still uses the same rays.
 if(length(p)>40.0) {
  float b=dot(p,v), discriminant=b*b-dot(p,p)+1600.0;
  if(discriminant>0.0 && b<0.0) p+=v*max(0.0,-b-sqrt(discriminant));
  else {gl_FragColor=vec4(sky(dir)*uExposure,1.0);return;}
 }
 vec3 light=vec3(0.0);
 float trans=1.0;
 float closest=100.0;
 bool captured=false;
 for(int i=0;i<180;i++) {
  float r=length(p); closest=min(closest,r);
  if(r<1.0) {captured=true;break;}
  if(r>max(40.0,length(uEye)+2.0) && dot(p,v)>0.0) break;
  float dt=clamp(r*.105,.035,1.4);
  vec3 acceleration=-1.5*h2*p/pow(r,5.0)*uLens;
  vec3 mid=p+v*dt*.5;
  vec3 vmid=v+acceleration*dt*.5;
  float rm=length(mid);
  vec3 next=p+vmid*dt;
  vec3 vn=v-1.5*h2*mid/pow(max(rm,.7),5.0)*uLens*dt;
  if(p.y*next.y<0.0) {
   float f=-p.y/(next.y-p.y);
   vec3 hit=mix(p,next,f);
   float radius=length(hit.xz);
   if(radius>3.0 && radius<12.0) {
    light+=trans*diskColor(hit,vmid);
    trans*=1.0-.92*uDisk;
    if(trans<.04) break;
   }
  }
  // Very faint scattering near the disk, for a soft luminous atmosphere.
  float haze=exp(-abs(p.y)*5.0)*exp(-pow((r-4.8)/3.5,2.0));
  light+=vec3(1.0,.42,.13)*haze*.008*dt*trans*uDisk;
  p=next; v=vn;
 }
 if(!captured) light+=sky(normalize(v))*trans;
 // A teaching highlight outlines the image boundary, not a physical surface.
 if(uHighlight>0.5 && uHighlight<1.5) {
  float critical=2.598;
  float ring=exp(-pow((angular-critical)/.035,2.0));
  light+=vec3(.52,.75,.80)*ring*.38;
 }
 light*=uExposure;
 float vignette=1.0-.18*pow(length(vUv-.5),1.4);
 gl_FragColor=vec4(light*vignette,1.0);
}
`;
