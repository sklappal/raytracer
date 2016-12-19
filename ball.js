function ball(pos, radius, material, id)
{
    this.pos = pos;
    this.radius = radius;
    this.radiusSqr = radius * radius;
    this.material = material;
    this.id = id;

    this.intersection = function(ray)
    {
      var diff = vec3.create();

      vec3.subtract(diff, ray.origin, this.pos);

      var dot = vec3.dot(diff, ray.direction);
      
      var d = dot * dot - vec3.squaredLength(diff) + this.radiusSqr;

      if (d < 0.0)
      {
        // no intersections
        return { count: 0};
      }

      var sqrtD = Math.sqrt(d);

      var first = - dot - sqrtD;
      var second = - dot + sqrtD;

      var intersectionPos;
      if (first < 1e-3)
      {
        if (second < 1e-3)
        {
          // Both points behind ray origin
          return {count: 0};
        }
        // first point behind ray origin
        intersectionPos = ray.parameterizedPoint(second);
      } 
      else if (second < 1e-3)
      {
        // second point behind ray origin
        intersectionPos = ray.parameterizedPoint(first);
      }
      else
      {
        
        var firstIntersection = ray.parameterizedPoint(first);
        var secondIntersection = ray.parameterizedPoint(second);

        // Two intersections in front of us, take nearest
        if (vec3.squaredDistance(firstIntersection, ray.origin) < vec3.squaredDistance(secondIntersection, ray.origin))
        {
          intersectionPos = firstIntersection;
        }
        else
        {
          intersectionPos = secondIntersection;
        }
      }

      var normal = vec3.create();
      vec3.subtract(normal, intersectionPos, this.pos);
      vec3.normalize(normal, normal);

      var reflection = GetReflection(ray.direction, normal);

      return {count : 1, pos: intersectionPos, normal: normal, reflection: reflection, material: this.material, itemId: this.id}
    }

    function GetReflection(incidentRay, planeNormal)
    {
      var dot = -vec3.dot(incidentRay, planeNormal);
      var ret = vec3.create();
      vec3.scale(ret, planeNormal, dot * 2);
      vec3.add(ret, ret, incidentRay);
      return ret;
    }

}