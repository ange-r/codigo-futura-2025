# Reflexiones sobre el ejercicio:

    #[contracterror]
    #[derive(Copy, Clone, Debug, Eq, PartialEq)]
    #[repr(u32)]
    pub enum Error {
        NombreVacio = 1,
       NombreMuyLargo = 2,
       NoAutorizado = 3,
       NoInicializado = 4,
    }
### Reflexiona:

***¿Por qué cada error tiene un número?***

 - Para ahorrar gas - Tipifico y estructuro los errores, ademas indorporo todas las variables (mach) 

***¿Qué error usarías si alguien intenta resetear el contador sin ser admin?***
 - Error 3
---
    #[contracttype]
    #[derive(Clone)]
    pub enum DataKey {
        Admin,
        ContadorSaludos,
        UltimoSaludo(Address),
    }


***Por qué Admin no tiene parámetros pero UltimoSaludo sí?***

 - Porque 'Admin' es una key simple, que es solo un valor, y 'UltimoSaludo(Adress)' a una Key compuesta que contiene un valor

***¿Qué storage usarás para cada key?***
 - Para 'Admin': Instance - Global
 - Para 'UltimoSaludo(Adress)': Persistance - Datos de usuario


