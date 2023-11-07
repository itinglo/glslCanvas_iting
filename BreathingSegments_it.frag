// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

//Noise functions------------------------------------//
float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*gnoise( uv ); uv = m*uv;          
    f += 0.2500*gnoise( uv ); uv = m*uv;
    f += 0.1250*gnoise( uv ); uv = m*uv;
    f += 0.0625*gnoise( uv ); uv = m*uv;
    return f;
}

//Gradient Noise 3D for noise
vec3 hash( vec3 p ) // replace this by something better
{
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
              dot(p,vec3(269.5,183.3,246.1)),
              dot(p,vec3(113.5,271.9,124.6)));

    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );
    
    vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

//Shape function----------------------------------//
float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

//Mouse-----------------------------------------------//
float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return 1.2-smoothstep(size*1.9, size, dist);  //size
    //return pow(dist, 0.5);
}

void main() {
    
    //調整畫面比例
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    //uv.x *= u_resolution.x/u_resolution.y;

    //畫面置中
    uv= uv*2.0-1.0;
    //調整老鼠的位置
    vec2 mouse= u_mouse/u_resolution.xy;
    mouse.x *= u_resolution.x/u_resolution.y;
    mouse=mouse*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    //亂數作用雲霧
    //float fog= fbm(0.1*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;
    //互動陰晴圓缺
    float interact=1.-mouseEffect(uv,mouse,0.18);

    
    //定義圓環
    float result;
    vec4 resultcol;
    for(float index=0.0;index<16.0;++index)
    {
        //float index=0.0;
        float noise_position= smoothstep(-0.9, 0.4, uv.x); //+-0.036
        float radius_noise=noise(vec3(2.180*uv,index+u_time*0.404))*-0.232/noise_position*0.5 - (interact *0.5);
        //float radius=0.572+radius_noise;
        //float circle_dist = circle(uv, radius);//光環大小

        float line = sdSegment(uv+radius_noise, vec2(sin(u_time),0.0),vec2(0.0,0.0));
        line *= noise_position+index*0.4; //光點
        
    
        //動態呼吸
        //float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
        //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
        float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
        float strength =(0.08*breathing+0.35);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
        float thickness=(0.0*breathing+0.015);          //[0.1~0.2]         //光環厚度 營造呼吸感
        float glow_line = glow(line, strength, thickness);

        result+=glow_line;
        resultcol = vec4(vec3(result),0.9)*vec4(0.2627, 0.4392, 0.5843, 0.9);
    }
    
    //gl_FragColor = vec4((vec3(result)),1.0);
    gl_FragColor = resultcol;
    //gl_FragColor = vec4(vec3(result)*vec3(1.0, 0.5, 0.25),1.0);
    //gl_FragColor = vec4(vec3(circle_dist),1.0); 
    //gl_FragColor = vec4(1.0-line);
}


