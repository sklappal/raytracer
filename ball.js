function ball(pos, radius, color, id)
{
    this.pos = pos;
    this.radius = radius;
    this.radiusSqr = radius * radius;
    this.color = color;
    this.id = id;

    this.intersection = function(ray)
    {
      var diff = vec3.create();

      vec3.subtract(diff, ray.origin, this.pos);

      var dot = vec3.dot(diff, ray.direction);
      
      var d = dot * dot - vec3.squaredLength(diff) + this.radiusSqr;

      if (d < 0.0)
      {
        return { count: 0};
      }

      var f = ray.parameterizedPoint(- dot - Math.sqrt(d));
      var s = ray.parameterizedPoint(- dot + Math.sqrt(d));

      var firstNormal = vec3.create();
      vec3.subtract(firstNormal, f, this.pos);
      vec3.normalize(firstNormal, firstNormal);
      var fr = GetReflection(ray.direction, firstNormal)

      var secondNormal = vec3.create();
      vec3.subtract(secondNormal, f, this.pos);
      vec3.normalize(secondNormal, secondNormal);
      var sr = GetReflection(ray.direction, secondNormal);

      return {count : 2, firstPos: f, firstNormal: firstNormal, firstReflection: fr, secondPos: s, secondNormal: secondNormal, secondReflection: sr}

    }

    function GetReflection(incidentRay, planeNormal)
    {
      var dot = vec3.dot(incidentRay, planeNormal);
      var ret = vec3.create();
      vec3.scale(ret, planeNormal, dot * 2);
      vec3.subtract(ret, ret, incidentRay);
      return ret;
    }

}