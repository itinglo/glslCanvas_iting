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

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

/*a function by website*/
float sdBlobbyCross( in vec2 pos, float he )
{
    pos = abs(pos);
    pos = vec2(abs(pos.x-pos.y),1.0-pos.x-pos.y)/sqrt(2.0);

    float p = (he-pos.y-0.25/he)/(6.0*he);
    float q = pos.x/(he*he*16.0);
    float h = q*q - p*p*p;
    
    float x;
    if( h>0.0 ) { float r = sqrt(h); x = pow(q+r,1.0/3.0)-pow(abs(q-r),1.0/3.0)*sign(r-q); }
    else        { float r = sqrt(p); x = 2.0*r*cos(acos(q/(p*r))/3.0); }
    x = min(x,sqrt(2.0)/2.0);
    
    vec2 z = vec2(x,he*(1.0-2.0*x*x)) - pos;
    return length(z) * sign(z.y);
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


void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;

    //定義圓環
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);   

    float result = 0.0;

    for(int i=0; i< 10; i++)
    {
        //動態呼吸 //我是9.5個呼吸 /4-> 以一個呼吸四秒算的話
        //float breathing=sin(u_time * 1.0 * pi /6.0)*0.5+0.5;	//option1
        //option2 蘋果的專利! 波峰和波谷有點不一樣
        float breathing=(exp(sin(u_time/5.0*pi)) - 0.36787944)*0.42545906412; 
        //float strength =(0.2*breathing*dir+0.180);

        //[0.2~0.3]	 //光暈強度加上動態時間營造呼吸感
        float strength =(5.0 * breathing + 0.180);//[0.2~0.3] //光暈強度加上動態時間營造呼吸感

        //float thickness=(0.01 * breathing + 0.084);//[0.1~0.2] //光環厚度 營造呼吸感
        float thickness = 0.0005;

        //model1-sdBlobbyCross
        //float weight = smoothstep(0.1 , -0.2, uv.y);
        float frequence = .05 * float(i) * 0.8;
        float uv_noise = gnoise(uv*10.0) * 0.5 + dir * frequence  ; //(amplitude) * frequence
 
        //float uv_noise = gnoise(uv*10.0) * weight ; 
        // + 改變外框的位移 +內外有點不一樣
        // (*)改變整體 感覺好像celluar automata 
        float d = sdBlobbyCross( uv* 0.6 * pi * uv_noise + uv_noise * 20.0+sin(u_time * 0.5), breathing); 


        //定質的話就不會動，但是如果也會動的話(上面的數值)那就會有動態
        float glow_circle = glow(d, strength, thickness); 

        result += glow_circle;
    }

    gl_FragColor = vec4(vec3(result)*vec3(0.6196, 0.8353, 0.9922),1.0);

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

float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
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








