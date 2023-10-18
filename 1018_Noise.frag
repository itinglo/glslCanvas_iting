// Author:CMH
// Title:BreathingGlow
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [0,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)));
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

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f; //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv; //震幅變一半 可能旋轉、其他變化
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
}

#define OCTAVES 6 //基底很大時候，高頻就滿適合的，但如果基底沒有就能沒甚麼差別
//就跟太過高頻其實你的耳朵也聽不到一樣，那就算去做訊號處理也沒有什麼意義
float fbm2 (in vec2 st) 
{
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) 
    {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;

    float pi=3.14159;
    //float info = hash2(uv * 7.5).x;
    //float info = gnoise(uv*15.0);
    //float info = random(uv*100.0); // 不管怎麼zoom in 都是一樣的，因為是random
    //float info = noise(uv * 1.0 + u_time * vec2(0.5 , 0.01)); //跟random不一樣的是zoom in out 會有差別
    //float info = fbm2(uv * 5.0);
    float info = fbm(uv * 5.0 + u_time * vec2(0.5 , 0.01));

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);//光環大小
    
    //動態呼吸 //我是9.5個呼吸 /4-> 以一個呼吸四秒算的話
    //float breathing=sin(u_time * 1.0 * pi /6.0)*0.5+0.5;	//option1
    //option2 蘋果的專利! 波峰和波谷有點不一樣
    float breathing=(exp(sin(u_time/5.0*pi)) - 0.36787944)*0.42545906412; 
    //float strength =(0.2*breathing*dir+0.180);
    //[0.2~0.3]	 //光暈強度加上動態時間營造呼吸感
    float strength =(0.2 * breathing + 0.180);//[0.2~0.3] //光暈強度加上動態時間營造呼吸感
    float thickness=(0.1 * breathing + 0.084);//[0.1~0.2] //光環厚度 營造呼吸感

    //定質的話就不會動，但是如果也會動的話(上面的數值)那就會有動態
    float glow_circle = glow(circle_dist, strength, thickness); 
    gl_FragColor = vec4(vec3(info)*vec3(0.0745, 0.6353, 0.9882),1.0);
}




/*
// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}



#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}


void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);                                //光環大小
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.2*breathing+0.180);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.1*breathing+0.084);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(circle_dist, strength, thickness);
    gl_FragColor = vec4((vec3(glow_circle)+fog)*dir*vec3(1.0, 0.5, 0.25),1.0);
}
*/








