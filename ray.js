function ray(origin, direction)
{
  this.origin = origin;
  this.direction = direction;

  this.parameterizedPoint = function(t)
  {
    var ret = vec3.create();
    return vec3.scaleAndAdd(ret, this.origin, this.direction, t);
  }

}