/// <reference path="../../../vendor/delaunay/delaunay.d.ts"/>
import { IPoint } from './Interfaces';
import { Segment } from './Segment';

function sorterByXThenY(pointA: IPoint, pointB: IPoint): number {
    if(pointA.x === pointB.x) {
        return pointA.y - pointB.y;
    } else {
        return pointA.x - pointB.x;
    }
}


function cross(pointO: IPoint, pointA: IPoint, pointB: IPoint): number {
    return (pointA.x - pointO.x) * (pointB.y - pointO.y) - (pointA.y - pointO.y) * (pointB.x - pointO.x);
}


function lineSegmentsCross(a: IPoint, b: IPoint, c: IPoint, d: IPoint): Boolean {
    let denominator = ((b.x - a.x) * (d.y - c.y)) - ((b.y - a.y) * (d.x - c.x));
    if (denominator === 0){
        return false;
    }

    let numerator1 = ((a.y - c.y) * (d.x - c.x)) - ((a.x - c.x) * (d.y - c.y));
    let numerator2 = ((a.y - c.y) * (b.x - a.x)) - ((a.x - c.x) * (b.y - a.y));

    if (numerator1 === 0 || numerator2 === 0) {
        return false;
    }

    let r = numerator1 / denominator;
    let s = numerator2 / denominator;

    return (r > 0 && r < 1) && (s > 0 && s < 1);
}

export class Polygon {

    private convexHull: Polygon;
    private _segments: Array<Segment>;
    private _triangles: Array<Array<number> >;

    constructor(private _points: Array<IPoint>) {
        if(!_points.length || _points.length < 3) {
            throw 'ERROR creating polygon, it needs at least 3 points';
        }
    }

    get points(): Array<IPoint> {
        return this._points;
    }

    get segments(): Array<Segment> {
        if(!this._segments) {
            this.createSegments();
        }
        return this._segments;
    }

    getConvexHull(): Polygon {
        if(!this.convexHull) {
            this.convexHull = this.calculateConvexHull();
        }
        return this.convexHull;
    }

    //Concave vertex are the ones that do not belong to the convexHull
    getConcaveVertex(): Array<IPoint> {
        let convexHull = this.getConvexHull();
        let result: Array<IPoint> = [];

        for(let point of this._points) {
            if(!convexHull.hasPoint(point)) {
                result.push(point);
            }
        }

        return result;
    }

    hasPoint(pointToSearch: IPoint): Boolean {
        for(let point of this._points) {
            if((point.x === pointToSearch.x) && (point.y === pointToSearch.y) ) {
                return true;
            }
        }
        return false;
    }

    isPointInside(point: IPoint): Boolean {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        var inside = false;
        for (var i = 0, j = this._points.length - 1; i < this._points.length; j = i++) {
            var xi = this._points[i].x, yi = this._points[i].y;
            var xj = this._points[j].x, yj = this._points[j].y;
            
            var intersect = ((yi > point.y) != (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    getClosestPointTo(point: IPoint): IPoint {
        var closestSegment = this.getClosestSegment(point);
        return closestSegment.getClosestPointTo(point);
    }

    private getClosestSegment(point: IPoint): Segment {
        let segments = this.segments;
        let closestSegment = this.segments[0];
        let minDistance = closestSegment.distance2ToPoint(point);
        for(let i = 1; i<segments.length; i++) {
            let nextSegment = segments[i];
            let nextDistance = nextSegment.distance2ToPoint(point);
            if(nextDistance < minDistance) {
                closestSegment = nextSegment;
                minDistance = nextDistance;
            }
        }

        return closestSegment;
    }

    get triangles(): Array<Array<number> > {
        if(!this._triangles) {
            this.triangulate();
        }
        return this._triangles;
    }

    private triangulate(): void {
        //Use http://gamedev.stackexchange.com/questions/31778/robust-line-of-sight-test-on-the-inside-of-a-polygon-with-tolerance
        // for line of sight
        //Create tests for edge cases

        var rawVertices = this.getRawVertices();
        Delaunay.triangulate(rawVertices, null);
    }

    private getRawVertices(): Array<Array<number> > {
        let result: Array<Array<number> > = [];
        this._points.forEach((point) => {
            result.push([point.x, point.y]);
        });
        return result;
    }

    //http://www.david-gouveia.com/portfolio/pathfinding-on-a-2d-polygonal-map/
    pointsCanSeeEachOther(pointA: IPoint, pointB: IPoint): Boolean {
        //TODO: bug here when clicking in the upper part of the wall sometimes.
        if(!this.isPointInside(pointA) || !this.isPointInside(pointB)) {
            return false;
        }
        if((pointA.x === pointB.x) && (pointA.y === pointB.y)) {
            return true;
        }
        for(let i = 0; i < this._points.length; i++) {
            for(let j = i + 1; j < this._points.length; j++) {
                if(lineSegmentsCross(
                    pointA,
                    pointB,
                    this._points[i],
                    this._points[i % this._points.length])) {
                        return false;
                }
            }
        }
        let segment = new Segment(pointA, pointB);
        return this.isPointInside(segment.getMiddlePoint());
    }

    // Using https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
    private calculateConvexHull(): Polygon {
        let orderedPoints = Array.from(this._points);
        orderedPoints.sort(sorterByXThenY);

        var lower : Array<IPoint> = [];
        for (var i = 0; i < orderedPoints.length; i++) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], orderedPoints[i]) <= 0) {
                lower.pop();
            }
            lower.push(orderedPoints[i]);
        }

        var upper : Array<IPoint> = [];
        for (var i = orderedPoints.length - 1; i >= 0; i--) {
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], orderedPoints[i]) <= 0) {
                upper.pop();
            }
            upper.push(orderedPoints[i]);
        }
        upper.pop();
        lower.pop();
        return new Polygon(lower.concat(upper));
    }

    private createSegments(): void {
        this._segments = [];
        for(let i=0; i < (this._points.length - 1); i++) {
            this._segments.push(new Segment(this._points[i], this._points[i+1]));
        }
        this._segments.push(new Segment(this._points[this._points.length - 1], this._points[0]));
    }
}

// Sort the points of P by x-coordinate (in case of a tie, sort by y-coordinate).

// Initialize U and L as empty lists.
// The lists will hold the vertices of upper and lower hulls respectively.

// for i = 1, 2, ..., n:
//     while L contains at least two points and the sequence of last two points
//             of L and the point P[i] does not make a counter-clockwise turn:
//         remove the last point from L
//     append P[i] to L

// for i = n, n-1, ..., 1:
//     while U contains at least two points and the sequence of last two points
//             of U and the point P[i] does not make a counter-clockwise turn:
//         remove the last point from U
//     append P[i] to U

// Remove the last point of each list (it's the same as the first point of the other list).
// Concatenate L and U to obtain the convex hull of P.
// Points in the result will be listed in counter-clockwise order.