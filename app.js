function App() {

  var VIEWPORT_WIDTH = 1.2;
  var VIEWPORT_HEIGTH = 0.9;

  var phong_exponent = 100;

  var balls = [
    new ball(Vec3(-1.5, -1.0, 5.0), 1.0, Vec3(1.0, 0.0, 0.0), 1),
    new ball(Vec3(1.5, -1.0, 5.0), 1.0, Vec3(0.0, 1.0, 0.0), 2),
    new ball(Vec3(0.0, 1.0, 5.0), 1.0, Vec3(0.0, 0.0, 1.0), 3),
    new ball(Vec3(0.0, -0.2, 3.0), 0.2, Vec3(1.0, 1.0, 1.0), 4),
    

  ];

  var lightPos = vec3.fromValues(2.0, 0.0, 0.0);

  var currentImageData;
  var currentProgress = 0.0;
  var currentLine = 0;
  var drawStart;

  function Draw() {

    var canvas = GetCanvas();
    var context = canvas.getContext('2d');
  
    currentImageData = CreateImageData();
    drawStart = Now();
    DrawInternal();
  }

  function DrawInternal()
  {
    ClearCanvas();
    FillText("Ray tracing (" + (currentProgress * 100).toFixed(2)  + "%) ...", 100, 100);
    var startTime = Now(); 
    for(x = currentLine; x < Width(); x++)
    {
      for(y = 0; y < Height(); y++)
      {
        var color = Raytrace(vec2.fromValues(x, y));
        if (color != undefined)
          SetPixel(currentImageData, x, y, color, 1.0);
      }
      currentProgress = x / Width();
      if (Now() - startTime > 100)
      {
        currentLine = x + 1;
        setTimeout(DrawInternal, 1);
        return;
      }
    }
    PutImageData(currentImageData);
    console.log("Draw took " + (Now() - drawStart) / 1000 + " s.");
  }


  function Raytrace(pix)
  {
    var dir = ImagePixelToWorld(pix);

    var nearest = undefined;
    for (i = 0; i < balls.length; i++)
    {
      var isec = balls[i].intersection(new ray(Vec3(0.0, 0.0, 0.0), dir));
      if (isec.count > 0)
      {
        if (nearest == undefined)
        {
          nearest = {isec: isec, ball: balls[i] };
          continue;
        }
        var cur_dist = vec3.squaredLength(isec.firstPos);
        var nearest_dist = vec3.squaredLength(nearest.isec.firstPos);
        if (cur_dist < nearest_dist )
        {
          nearest = {isec: isec, ball: balls[i] };
        }
      }
    }
    if (nearest != undefined)
    {
      return CalculateLighting(nearest.isec, nearest.ball);
    }
    
    return undefined;
  }

  function CalculateLighting(isec, ball)
  {
      var lightingScaler = CalculateLightingScaler(isec.firstPos, isec.firstNormal, ball);
      var color = Vec3(0.0, 0.0, 0.0);
      specular = Vec3(1.0, 1.0, 1.0);
      var phong = Math.pow(lightingScaler, phong_exponent);
      vec3.scale(specular, specular, phong);

      var diffuse = vec3.create();
      vec3.scale(diffuse, ball.color, lightingScaler);

      var ambient = Vec3(0.1, 0.0, 0.1);
      
      vec3.add(color, color, specular);
      vec3.add(color, color, ambient);
      vec3.add(color, color, diffuse);

      return color;
  }

  function CalculateLightingScaler(reflectionPos, reflectionNormal, ball)
  {
    var lightToPos = vec3.create();
    vec3.subtract(lightToPos, reflectionPos, lightPos);

    vec3.normalize(lightToPos, lightToPos);

    for (i = 0; i < balls.length; i++)
    {
      if (balls[i].id == ball.id)
      {
        continue;
      }
      var isec = balls[i].intersection(new ray(lightPos, lightToPos));
      if (isec.count > 1)
      {
        var dist1 = vec3.squaredDistance(lightPos, isec.firstPos);
        var dist2 = vec3.squaredDistance(lightPos, isec.secondPos);
        var isecDist = vec3.squaredDistance(lightPos, reflectionPos);
        if (dist1 < isecDist || dist2 < isecDist)
        {
          return 0.0; // in the shadooooows
        }
      }
    }

    var cos = vec3.dot(reflectionNormal, lightToPos);
    return -1.0 * Math.min(0.0, cos);
  }

  function ImagePixelToWorld(pix)
  {
    var ret = Vec3( 
        VIEWPORT_WIDTH * (pix[0] - Width() * 0.5) / Width(),
        VIEWPORT_HEIGTH * (pix[1] - Height() * 0.5) / Height(),
        1.0);
    return vec3.normalize(ret, ret);
  }

  function FillText(text, xpos, ypos)
  {
    var ctx = GetContext();
    ctx.font = "bold 16px Segoe UI";
    ctx.fillStyle = "#ff0000";
    ctx.fillText(text, xpos, ypos);
  }

  function ClearCanvas() {
    var ctx = GetContext();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function GetContext() {
    return GetCanvas().getContext("2d");
  }

  function GetCanvas() {
    return document.getElementById("canvas");
  }

  function Width()
  {
    return GetCanvas().width;
  }

  function Height()
  {
    return GetCanvas().height;
  }

  function CreateImageData()
  {
    context = GetContext()
    return context.createImageData(Width(), Height());
  }

  function PutImageData(imageData)
  {
    GetContext().putImageData(imageData, 0, 0); 
  }

  function SetPixel(imageData, x, y, rgb, a) {
    var index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = Math.max(Math.min(rgb[0] * 255, 255), 0);
    imageData.data[index+1] = Math.max(Math.min(rgb[1] * 255, 255), 0);
    imageData.data[index+2] = Math.max(Math.min(rgb[2] * 255, 255), 0);
    imageData.data[index+3] = Math.max(Math.min(a * 255, 255), 0);
  }

  this.Start = function(size) {

    var w = 600;
    var h = 450;

    if (size == "large")
    {
      w = 1200;
      h = 900;
    }

    if (size == "small")
    {
      w = 300;
      h = 225;
    }

    GetCanvas().width = w;
    GetCanvas().height = h;
    GetCanvas().parentNode.style.width = w;
    GetCanvas().parentNode.style.height = h

    timer(Draw, "Draw");
  }

  function Vec3(x, y, z)
  {
    return vec3.fromValues(x, y, z);
  }

  function Now()
  {
    return new Date().getTime();
  }

  function timer(f, name)
  {
    var time = Now();
    f();
    console.log(name + " took " + (Now() - time) / 1000 + " s.");
  }

  return this;
}