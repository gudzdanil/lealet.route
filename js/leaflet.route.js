(function(){
    L.Route = L.Polyline.extend({
        _polyPoints: [],
        _icon: L.divIcon({className: 'leaflet-arrow-icon rounded'}),
        _iconAdd: L.divIcon({className: 'leaflet-arrow-icon rounded plus'}),

        options: {
            staticSize: false,    //static size of arrow in meters or percent depending on length of line
            percent: 0.1,           //arrow percent length from length of line
            size: 100,              //meters
            angle: 20,
            weight: 2,
            opacity: 1,
            editable: false,
            color: '#d00'
        },

        initialize: function (latlngs, options){
            this._polyPoints = [];
            L.Polyline.prototype.initialize.call(this, [], options);
            this._setLatLngs(this._convertLatLngs(latlngs));
        },

        onAdd: function (map) {
            L.Polyline.prototype.onAdd.call(this, map);
            this._map = map;
            this._print();
            this._bindMap(this.options.editable);
            if(this.options.editable) {
                this._bindDragging(true);
            }
        },

        onRemove: function(map){
            this._bindMarkers(false);
            this._bindMap(false);
            while(this._polyPoints.length){
                this._removeArrow(0);
            }
            L.Polyline.prototype.onRemove.call(this, map);
        },

        getCoords: function(){
            return this._latlngs;
        },

        setEditable: function(flag){
            if(flag != this.options.flag) {
                this.options.editable = flag;
                this._bindMap(flag);
                this._bindMarkers(flag);
                this._bindDragging(flag);
            }
        },

        _bindMap: function(flag){
            if(this._map) {
                this._map[flag ? 'on' : 'off']('click', this._onAdd, this);
            }
        },

        _bindMarker: function(flag, marker){
            if(marker) {
                marker[flag ? 'on' : 'off']('click', this._onRemove, this);
                marker[flag ? 'on' : 'off']('drag', this._onDrag, this);
                if(this._map){
                    marker.dragging[flag ? 'enable' : 'disable']();
                }
            }
        },

        _bindDragging: function(flag){
            var i;
            var curOperation = flag ? 'enable' : 'disable';
            for(i = 0 ; i < this._polyPoints.length; i++) {
                if(this._polyPoints[i].marker) {
                    this._polyPoints[i].marker.dragging[curOperation]();
                }
            }
        },

        _bindHalfMarker: function(flag, marker){
            if(marker) {
                marker[flag ? 'on' : 'off']('click', this._onAddHalf, this);
            }
        },

        _bindMarkers: function(flag){
            var i;
            for(i = 0 ; i < this._polyPoints.length; i++) {
                this._bindMarker(flag, this._polyPoints[i].marker);
                this._bindHalfMarker(flag, this._polyPoints[i].halfMarker);
            }
        },

        _onRemove: function(e){
            this._removeArrow(this._polyPoints.filter(function(el){
                return el.marker == e.target;
            })[0].index);
        },

        _onAdd: function(e){
            this._addArrow(this._polyPoints.length, e.latlng);
        },

        _onAddHalf: function(e){
            var cur = this._polyPoints.filter(function(el){return el.halfMarker == e.target})[0];
            this._removeConnection(cur.index);
            this._addArrow(cur.index + 1, e.target.getLatLng());
        },

        _onDrag: function(e){
            var cur = this._polyPoints.filter(function(el){return el.marker == e.target;})[0];
            var latlng = e.target.getLatLng();
            this.spliceLatLngs(cur.index, 1, latlng);
            cur.point = latlng;
            if(cur.index){
                this._removeConnection(cur.index-1);
                this._connectPoints(cur.index-1, cur.index);
            }
            if(cur.index < this._polyPoints.length-1){
                this._removeConnection(cur.index);
                this._connectPoints(cur.index, cur.index+1);
            }

        },

        _addArrow: function(index, latlng){
            var cur = {
                point: latlng,
                marker: this._createMarker(latlng)
            };
            this.spliceLatLngs(index, 0, latlng);
            this._polyPoints.splice(index, 0, cur);

            if(index){
                this._connectPoints(index-1, index);
            }
            if(this._polyPoints[index + 1]){
                this._connectPoints(index, index+1);
            }
            this._resetIndexes();
        },

        _removeConnection: function(index){
            var cur = this._polyPoints[index];
            this._bindMarker(false, cur.halfMarker);
            if(this._map){
                if(cur.halfMarker) {
                    this._map.removeLayer(cur.halfMarker);
                }
                if(cur.arrow) {
                    this._map.removeLayer(cur.arrow);
                }
            }
        },

        _removeArrow: function(index){
            var cur;
            this.spliceLatLngs(index, 1);
            cur = this._polyPoints[index];
            this._bindMarker(false, cur.marker);
            this._removeConnection(index);
            if(this._map){
                this._map.removeLayer(cur.marker);
            }
            this._polyPoints.splice(index, 1);
            if(index){
                this._removeConnection(index-1);
                if(this._polyPoints[index]) {
                    this._connectPoints(index - 1, index);
                }
            }
            this._resetIndexes();
        },

        _resetIndexes: function(){
            var i, cur;
            for(i = 0; i < this._polyPoints.length; i++){
                cur = this._polyPoints[i];
                cur.index = i;
                if(cur.marker._icon){
                    cur.marker._icon.innerHTML = cur.index;
                }
            }
        },

        _connectPoints: function(ind1, ind2){
            var first = this._polyPoints[ind1],
                second = this._polyPoints[ind2];
            first.halfMarker = this._createHalfMarker(first.point, second.point);
            first.arrow = this._createArrow(first.point, second.point);
        },

        _setLatLngs: function(latlngs){
            //this.clear();
            var i;
            for(i = 0; i < latlngs.length; i++){
                this._polyPoints.push({
                    index: i,
                    point: latlngs[i],
                    marker: this._createMarker(latlngs[i]),
                    halfMarker: this._createHalfMarker(latlngs[i], latlngs[i+1]),
                    arrow: this._createArrow(latlngs[i], latlngs[i+1])
                });
            }
        },

        _createMarker: function(latlng){
            var marker = L.marker(latlng,{
                icon: this._icon
            });
            if(this._map){
                marker.addTo(this._map);
            }
            this._bindMarker(this.options.editable, marker);
            return marker;
        },

        _createHalfMarker: function(latlngStart, latlngEnd){
            var marker;
            if(latlngEnd) {
                marker = L.marker(L.latLng(
                        (latlngEnd.lat + latlngStart.lat) / 2,
                        (latlngEnd.lng + latlngStart.lng) / 2
                ), {
                    icon: this._iconAdd
                });
                if(this._map){
                    marker.addTo(this._map);
                }
                this._bindHalfMarker(this.options.editable, marker);
            }
            return marker;
        },

        _createArrow: function(latlngStart, latlngEnd){
            if(latlngEnd) {
                var bearing = this._getBearing(latlngStart, latlngEnd);
                var basicPoint = this._destBearing(latlngEnd, bearing + 180, 10);
                var length = this.options.staticSize
                    ? this.options.size
                    : latlngStart.distanceTo(latlngEnd) * this.options.percent;

                var leftAngle = (bearing + 180 + this.options.angle) % 360,
                    rightAngle = (bearing + 180 - this.options.angle) % 360;

                var polygon = L.polygon([
                    this._destBearing(basicPoint, leftAngle, length),
                    basicPoint,
                    this._destBearing(basicPoint, rightAngle, length)
                ], {
                    fillOpacity: 1,
                    opacity: 1,
                    weight: 1,
                    color: this.options.color
                });
                if(this._map){
                    polygon.addTo(this._map);
                }
                return polygon;
            }
        },

        _print: function(){
            var i, cur;
            this.setLatLngs([]);
            if(this._polyPoints.length){
                cur = this._polyPoints[0];
                this.addLatLng(cur.point);
                cur.marker.addTo(this._map);
            }
            for(i = 1; i < this._polyPoints.length; i++){
                cur = this._polyPoints[i];
                cur.marker.addTo(this._map);
                this.addLatLng(cur.point);
                this._connectPoints(i-1, i);
            }
            this._resetIndexes();
            this.redraw();
        },

        _getBearing: function (latlngA, latlngB) {
            var radian = Math.PI / 180;

            var lat1 = radian * (latlngA.lat), lat2 = radian * (latlngB.lat), lon1 = latlngA.lng, lon2 = latlngB.lng;
            var dLon = radian * (lon2-lon1);
            var y = Math.sin(dLon) * Math.cos(lat2);
            var x = Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
            return this._toBrng(Math.atan2(y, x));
        },

        _toBrng: function(val){
            return (val * 180 / Math.PI + 360) % 360;
        },

        _destBearing: function (coords, bearing, dist){
            var R = 6378.137;
            var rad = Math.PI / 180;
            var angDist = dist / 1000 / R;
            bearing = bearing * rad;

            var lat = coords.lat * rad;
            var lon = coords.lng * rad;

            var latFinal = Math.asin(Math.sin(lat)*Math.cos(angDist) +
                Math.cos(lat)*Math.sin(angDist)*Math.cos(bearing) );

            var lonFinal = lon + Math.atan2(Math.sin(bearing)*Math.sin(angDist)*Math.cos(lat),
                    Math.cos(angDist)-Math.sin(lat)*Math.sin(latFinal));

            lonFinal = (lonFinal+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

            return L.latLng(latFinal/rad, lonFinal/rad);
        }

    });

    L.route = function(latlngs, options){
        return new L.Route(latlngs, options);
    }
})();