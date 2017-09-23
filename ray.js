function ray(origin, direction)
{
  this.origin = origin;
  this.direction = direction;

  this.parameterizedPoint = function(vec, t)
  {
    return vec3.scaleAndAdd(vec, this.origin, this.direction, t);
  }

}