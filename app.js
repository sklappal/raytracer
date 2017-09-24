function App() {

  var VIEWPORT_WIDTH = 1.2;
  var VIEWPORT_HEIGTH = 0.9;

  var CANVAS = document.getElementById("canvas");

  var phong_exponent = 100;

  var AMBIENT = Vec3(0.05, 0.05, 0.05);

  var materials = 
  {
    red: new material(Vec3(1.0, 0.0, 0.0), 0.3),
    blue: new material(Vec3(0.0, 0.0, 1.0), 0.0),    
    green: new material(Vec3(0.0, 1.0, 0.0), 0.5),
    white: new material(Vec3(1.0, 1.0, 1.0), 0.0),
    whiteReflective: new material(Vec3(1.0, 1.0, 1.0), 0.9),
    turquoise: new material(Vec3(0.0, 0.8, 0.8), 0.8)
  };

  var lightPos = vec3.fromValues(2.0, 0.0,  0.0);
  var lightId = 100;
  var items = [
    new ball(Vec3(-1.5, -1.0, 5.0), 1.0, materials["red"], 1),
    new ball(Vec3(1.5, -1.0, 5.0), 1.0, materials["green"], 2),
    new ball(Vec3(0.0, 1.0, 5.0), 1.0, materials["blue"], 3),
    new ball(Vec3(0.0, -0.5, 5.0), 0.2, materials["whiteReflective"], 4),
    new quad(Vec3(3.2, 2.7, 7.0), Vec3(3.2, -2.7,  7.0), Vec3(-3.2, 2.7,  7.0), materials["white"], 5),  
    new quad(Vec3(1.5, 2.0, 6.0), Vec3(1.5, -2.0,  6.0), Vec3(-1.5, 2.0,  5.0), materials["turquoise"], 6),
    //light
    //new ball(lightPos, 0.1, materials["white"], lightId)

  ];

  var currentSize = "medium";
  var currentAntialias = 1;
  var cancelCallback;
  var currentImageData;
  var currentProgress = 0.0;
  var currentLine = 0;
  var drawStart;

  document.forms.myForm.addEventListener('change', function(e) {  
    if (e.target.name === "size")
    {
      currentSize = e.target.value;
    }
    if (e.target.name === "antialias")
    {
      currentAntialias = Number(e.target.value);
    }

    console.log("drawStart: ", drawStart)
    console.log("cancelCallback: ", cancelCallback)
    console.log("currentSize: ", currentSize)
    console.log("currentAntialias: ", currentAntialias)
    if (drawStart === undefined) // not actively drawing
    {
      Start();
    }
    else
    {
      cancelCallback = Start;
    }

  });


  function Draw() {
    currentLine = 0;
    currentProgress = 0.0;
    currentLine = 0;
    currentImageData = CreateImageData();
    drawStart = Now();
    DrawInternal();
  }

  function DrawInternal()
  {
    ClearCanvas();
    
    var startTime = Now(); 
    for(y = currentLine; y < Height(); y++)
    {
      for(x = 0; x < Width(); x++)
      {
        var color = RaytracePixel(x, y, currentAntialias);
        SetPixel(currentImageData, x, y, color, 1.0);

        if (cancelCallback != undefined) // cancel requested, jump to the callback
        {
          setTimeout(cancelCallback, 1);
          cancelCallback = undefined;
          return;
        }
      }
      if (Now() - startTime > 400)
      {
        currentLine = y + 1;
        PutImageData(currentImageData);

        currentProgress = y / Height();
        FillText("Ray tracing (" + (currentProgress * 100).toFixed(2)  + "%) ...", 100, 100);
        setTimeout(DrawInternal, 1);
        return;
      }
    }
    PutImageData(currentImageData);
    console.log("Draw took " + (Now() - drawStart) / 1000 + " s.");
    drawStart = undefined;
  }

  function RaytracePixel(x, y, antialiasLevel)
  {
    var dirs = [];
    for (var i = 0; i < antialiasLevel; i++)
    {
      for (var j = 0; j < antialiasLevel; j++)
      {
        dirs.push([x + 1.0 / antialiasLevel * i, y + 1.0 / antialiasLevel * j]);
      }
    }

    var color = [0.0, 0.0, 0.0];
    var sampleCount = dirs.length;
    for (var i = 0; i < sampleCount; i++)
    {
      var dir = ImagePixelToWorld(vec2.fromValues(dirs[i][0], dirs[i][1]));    
      var currentColor = Raytrace(new ray(Vec3(0.0, 0.0, 0.0), dir), 4);
      color = [
        color[0] + currentColor[0] / sampleCount, 
        color[1] + currentColor[1] / sampleCount, 
        color[2] + currentColor[2] / sampleCount];
    }
    return color;
  }

  function Raytrace(currentRay, level)
  {
    if (level == 0)
    {
      return Vec3(0.0, 0.0, 0.0);
    }

    var nearest = undefined;
    for (i = 0; i < items.length; i++)
    {
      var isec = items[i].intersection(currentRay);
      if (isec.count > 0)
      {
        if (nearest == undefined)
        {
          nearest = {isec: isec, item: items[i] };
          continue;
        }
        var cur_dist = vec3.squaredLength(isec.pos);
        var nearest_dist = vec3.squaredLength(nearest.isec.pos);
        if (cur_dist < nearest_dist )
        {
          nearest = {isec: isec, item: items[i] };
        }
      }
    }
    if (nearest != undefined)
    {
      var isec = nearest.isec;
      var reflectionColor = Vec3(0.0, 0.0, 0.0);
      if (isec.material.reflectivity > 0)
      {
        var reflectionRay = new ray(isec.pos, isec.reflection);
        var reflection = Raytrace(reflectionRay, level-1);
        if (reflection != undefined)
        {
          vec3.scale(reflectionColor, reflection, isec.material.reflectivity)
        }
      }

      var myColor = CalculateLighting(isec);

      return vec3.add(myColor, myColor, reflectionColor);
    }
    
    return Vec3(0.0, 0.0, 0.0);
  }

  function CalculateLighting(isec)
  {
      var lightingScaler = CalculateLightingScaler(isec.pos, isec.normal, isec.itemId);
      var color = Vec3(0.0, 0.0, 0.0);
      var specular = Vec3(1.0, 1.0, 1.0);
      var phong = Math.pow(lightingScaler, phong_exponent);
      phong *= (1.0 - isec.material.reflectivity);
      vec3.scale(specular, specular, phong);

      var diffuse = vec3.create();
      lightingScaler -= phong;
      lightingScaler *= (1.0 - isec.material.reflectivity);
      vec3.scale(diffuse, isec.material.color, lightingScaler);

      vec3.add(color, color, specular);
      vec3.add(color, color, AMBIENT);
      vec3.add(color, color, diffuse);

      return color;
  }

  function CalculateLightingScaler(reflectionPos, reflectionNormal, id)
  {
    var lightToPos = vec3.create();
    vec3.subtract(lightToPos, reflectionPos, lightPos);

    vec3.normalize(lightToPos, lightToPos);

    var shadow = 1.0;

    for (i = 0; i < items.length; i++)
    {
      if (items[i].id == id || items[i].id == lightId)
      {
        continue;
      }

      var isec = items[i].intersection(new ray(lightPos, lightToPos));
      if (isec.count > 0)
      {
        var dist = vec3.squaredDistance(lightPos, isec.pos);
        var isecDist = vec3.squaredDistance(lightPos, reflectionPos);
        if (dist < isecDist)
        {
          return 0.0;
        }
      }
    }

    shadow = Math.max(0.0, shadow)

    var cos = vec3.dot(reflectionNormal, lightToPos);
    return -1.0 * Math.min(0.0, cos) * shadow;
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
    ctx.strokeStyle ="#000000";
    ctx.strokeText(text, xpos, ypos);
  }

  function ClearCanvas() {
    var ctx = GetContext();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function GetContext() {
    return GetCanvas().getContext("2d");
  }

  function GetCanvas() {
    return CANVAS;
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

  this.Start = function() {

    var w,h;
    if (currentSize == "extralarge")
    {
      w = 2400;
      h = 1800;
      this.document.getElementById("11").checked = true;
    }

    if (currentSize == "large")
    {
      w = 1200;
      h = 900;
      this.document.getElementById("12").checked = true;
    }

    if (currentSize == "medium")
    {
      w = 600;
      h = 450;
      this.document.getElementById("13").checked = true;
    }

    if (currentSize == "small")
    {
      w = 300;
      h = 225;
      this.document.getElementById("14").checked = true;
    }

    if (currentAntialias == 1)
    {
      this.document.getElementById("21").checked = true;
    }

    if (currentAntialias == 2)
    {
      this.document.getElementById("22").checked = true;
    }

    if (currentAntialias == 3)
    {
      this.document.getElementById("23").checked = true;
    }


    GetCanvas().width = w;
    GetCanvas().height = h;
    GetCanvas().parentNode.style.width = w;
    GetCanvas().parentNode.style.height = h

    Draw();
  }

  function Vec3(x, y, z)
  {
    return [x, y, z];
  }

  function Now()
  {
    return new Date().getTime();
  }

  return this;
}