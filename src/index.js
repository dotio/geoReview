import './style/style.scss';
import { getToday } from './js/today';
import items from './index/items.hbs';

const modal = document.querySelector('.modal');
const reviewList = document.querySelector('.review__list');
const closeModal = document.querySelector('.fa-times');
const inputName = document.querySelector('.review-form__input--name');
const inputPlace = document.querySelector('.review-form__input--place');
const inputArea = document.querySelector('.review-form__textArea');
const addBtn = document.querySelector('.review-form__addBtn--add');
const form = document.querySelector('.review-form');   
const modalTitle = document.querySelector('.modal__header--title');
let inputsArr = [inputName, inputPlace, inputArea];
let addressInput = document.getElementById('address');
let coordsInput = document.getElementById('coords');
let comments = localStorage.getItem('comments') ? JSON.parse(localStorage.getItem('comments')) : [];

ymaps.ready(function () {

    // init map
    const map = new ymaps.Map('map', {
        center: [42.45306, 18.5375],
        zoom: 15,
        controls: [],
        type: 'yandex#satellite'
    });

    // manage baloon
    let objectManager = new ymaps.ObjectManager({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: true,
        clusterize: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 150,
    });

    // if 1 comment - don't open baloon
    objectManager.options.set('geoObjectOpenBalloonOnClick', false);
    map.geoObjects.add(objectManager);

    // inside items
    function setComment({ address, coords, name, place, text }) {
        let comment = {
            address,
            coords: coords.split(',').map(parseFloat),
            name,
            place,
            textReview: text,
            date: getToday()
        }

        comments.push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        form.reset();
    }

    function getComments(address) {
        const filteredComments = comments.filter((comment) => {
            
            return comment.address == address;
        });
        
        reviewList.innerHTML = '';
        let templatedComments = items({ reviews: filteredComments });

        reviewList.innerHTML = templatedComments;
    }
    function revSwitch({ address, coords, isVisible }) {
        if (isVisible) {
            addressInput.value = address;
            coordsInput.value = coords;
            modalTitle.innerText = address;
        
            modal.classList.remove('hide');
            modal.style.top = event.clientY + 'px';
            modal.style.left = event.clientX + 'px';
            
            return;
        }
        
        modal.classList.add('hide');
    }
    map.events.add('click', function (e) {
        let coords = e.get('coords');

        reviewList.innerHTML = '';
        reviewList.innerText = 'Пока нет комментариев';
        
        ymaps.geocode(coords).then((result) => {
            let geoInfo = result.geoObjects.get(0);
            let address = geoInfo.properties.get('text');

            for (let comment of comments) {
                if (comment.address === address) {
                    coords = comment.coords;    
                }
            }

            revSwitch({ address, coords, isVisible: true });
            getComments(address);
            
        })   
    });
    closeModal.addEventListener('click', () => {
        revSwitch({ isVisible: false });
    });
    function validateForm() {
        let isValid = true;
    
        for ( let elem of inputsArr ) {

            if ( elem.value === '' ) {
                elem.style.border='1px solid red';
                isValid = false;
            } 
        }

        return isValid;   
    }
    objectManager.objects.events.add('click', (e) => {
        let objectId = e.get('objectId');
        let { address, coords } = comments[objectId];

        getComments(address);
        revSwitch({ address, coords, isVisible: true });
    })
    objectManager.clusters.events.add('balloonopen', () => {
        revSwitch({ isVisible: false });
    })
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let isValid = validateForm();
    
        if ( isValid ) {
            const address = addressInput.value;
            const coords = coordsInput.value;
            const name = inputName.value;
            const place = inputPlace.value;
            const text = inputArea.value;
    
            setComment({ address, coords, name, place, text });
            revSwitch({ isVisible: false });
            setMap();
        }
    });

    // baloon set
    function setMap() {
        comments.forEach((comment, i) => {
            objectManager.objects.add({
                type: 'Feature',
                id: i,
                geometry: {
                    type: 'Point',
                    coordinates: comment.coords
                    
                },
                properties: {
                    balloonContentHeader: `<b> ${comment.place}</b>`,
                    balloonContentBody: `<a href="#" class="address_link" data-id="${i}">${comment.address}</a><br/>
                                        <p><b>${comment.textReview}</b></p>`,
                    balloonContentFooter: `<div style="float: right">${comment.date}</div>`
                }
            })
        })
    }
    document.addEventListener('click', (e) => {
        let target = e.target;

        if ( target.className === 'address_link' ) {
            let id = target.dataset.id;
            let { address, coords } = comments[id];

            getComments(address);
            revSwitch({ address, coords, isVisible: true });
            objectManager.clusters.balloon.close();
        }
    });
    setMap();

});
