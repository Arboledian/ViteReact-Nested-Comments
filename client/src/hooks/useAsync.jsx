import { useCallback, useEffect, useState } from "react";

export function useAsync(func, dependencies = []) {
  //loading true porque se usa useEffect, haciendo esto se llama instanteamente
  const { execute, ...state } = useAsyncInternal(func, dependencies, true);

  //se llama execute como funcion y tmb para las dependencias
  useEffect(() => {
    execute();
  }, [execute]);
  //retorna la info de state
  return state;
}

export function useAsyncFn(func, dependencies = []) {
  //llama a la otra función, usa false para que no se llame automaticamente
  return useAsyncInternal(func, dependencies, false);
}

function useAsyncInternal(func, dependencies, initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState();
  const [value, setValue] = useState();

  const execute = useCallback((...params) => {
    setLoading(true);
    return (
      func(...params)
        .then(data => {
          //devuelve data sin error
          setValue(data);
          setError(undefined);
          return data;
        })
        //devuelve el error sin data y rechaza el error
        .catch(error => {
          setError(error);
          setValue(undefined);
          return Promise.reject(error);
        })
        .finally(() => {
          //ya no está cargando
          setLoading(false);
        })
    );
    //recarga la función solo cuando cambian las dependencias
  }, dependencies);

  //retorna los valores y la capacidad de ejecutar la funcion
  return { loading, error, value, execute };
}
