const findMyLocation = () =>{
    const status = document.querySelector('.status');


    const success = (position)=>{
        console.log(position);
    }

    const error = ()=>{
        status.textContent = 'Nu se poate accesa locatia.';
    }

    navigator.geolocation.getCurrentPosition(succes,error);

}

document.querySelector('.find-city').addEventListener('click',findMyLocation);