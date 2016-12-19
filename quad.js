// corners are clockwise
function quad(corner1, corner2, corner3, material, id)
{
    var s = vec3.create();
    var t = vec3.create();
    vec3.subtract(s, corner2, corner1);
    vec3.subtract(t, corner3, corner1);

    this.normal = vec3.create();
    vec3.cross(this.normal, s, t);
    vec3.normalize(this.normal, this.normal);
    
    this.origin = corner1;

    this.s = s;
    this.t = t;

    this.squaredLengthS = vec3.squaredLength(this.s);
    this.squaredLengthT = vec3.squaredLength(this.t);

    this.material = material;
    this.id = id;

    this.intersection = function(ray)
    {
      var dot = vec3.dot(this.normal, ray.direction);
      if (Math.abs(dot) < 0.0001)
      {
        // ray lies in the quad plane, treat as no-intersection
        return { count: 0}
      }

      // dot(n, x0-r0) / dot(n0, d)

      var rayToPlaneOrigin = vec3.create();
      vec3.subtract(rayToPlaneOrigin, this.origin, ray.origin);

      var t = vec3.dot(rayToPlaneOrigin, this.normal) / dot;

      if (t < 1e-3)
      {
        return {count: 0}
      }

      var intersectionPoint = ray.parameterizedPoint(t);

      var testPoint = vec3.create();
      vec3.subtract(testPoint, intersectionPoint, this.origin);

      var projection = vec3.dot(this.s, testPoint);
      if (projection < 0 || projection > this.squaredLengthS)
      {
        return { count: 0}
      }

      var projection = vec3.dot(this.t, testPoint);
      if (projection < 0 || projection > this.squaredLengthT)
      {
        return { count: 0}
      }

      return { count: 1, pos: intersectionPoint, normal: this.normal, reflection: GetReflection(ray.direction, this.normal), material: this.material, itemId: this.id}
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