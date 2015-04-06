function init() {
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        attribution: 'Test task by Gudz Danil',
        id: 'examples.map-i875mjb7'
    }).addTo(map);
    var flag = false;
    var arrows = [];
    var arrow = L.polyArrow([
        [51.505, -0.09],
        [51.510, -0.08],
        [51.511, -0.07],
        [51.515, -0.08],
        [51.514, -0.06],
        [51.508, -0.06]
    ], {
        angle: 10,
        staticSize: true,
        size: 80,
        editable: flag
    }).addTo(map);
    arrows.push(arrow);

    var rem = document.getElementById('remove');
    rem.onclick = function(){
        map.removeLayer(arrows.pop());
    }
    var cr = document.getElementById('new');
    cr.onclick = function(){
        flag = true;
        arrows[arrows.length-1].setEditable(false);
        arrow = new L.PolyArrow([], {
            angle: 10,
            staticSize: true,
            size: 80,
            editable: flag
        }).addTo(map);
        arrows.push(arrow);
    }
    var edit = document.getElementById('edit');
    edit.onclick = function(){
        flag = !flag;
        arrow.setEditable(flag);
    }
    var coords = document.getElementById('coords');
    var temp = document.getElementById('temp');
    coords.onclick = function(){
        temp.innerHTML = arrow.getCoords();
    }
}