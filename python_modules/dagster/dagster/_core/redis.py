import abc
from functools import cached_property
from typing import (
    Union, TypeVar, Optional, Iterable,
    Tuple, Dict, Type
)

from redis.client import StrictRedis
from redis.connection import parse_url
from typing_extensions import TypeAlias

ValueType = TypeVar("ValueType", bound=Union[str, bytes])
_Value: TypeAlias = Union[bytes, float, int, str]
_Key: TypeAlias = Union[str, bytes]


def conn_kw_from_url(url, impl) -> Dict:
    return parse_url('redis' + url[len(impl):])


class Redis(abc.ABC):
    impl: str = None
    _registry: Dict[str, Type['Redis']] = {}

    def __init__(self, url, **kwargs):
        pass

    @cached_property
    def client(self):
        return self._create_client()

    @abc.abstractmethod
    def _create_client(self):
        raise NotImplementedError

    def __init_subclass__(cls, **kwargs):
        if (impl_type := cls.impl) in cls._registry:
            raise RuntimeError(
                f"Cannot register type {impl_type} for {cls}. "
                f"{impl_type} has already been registered by {cls._registry[impl_type]}."
            )

        cls._registry[impl_type] = cls

    def brpop(
        self,
        keys: Union[_Key, Iterable[_Key]],
        timeout: Optional[int] = 0
    ) -> Optional[Tuple[ValueType, ValueType]]:
        return self.client.brpop(keys, timeout)

    def lpush(self, name: str, *values: _Value) -> int:
        return self.client.lpush(name, *values)

    def close(self, close_connection_pool: Optional[bool] = None):
        self.client.close(close_connection_pool)

    @classmethod
    def from_url(cls, url, **kwargs):
        impl_type, _ = url.split('://', 1)
        if impl_type not in cls._registry:
            raise NotImplementedError(f'Unknown redis type: {impl_type}')
        impl = cls._registry[impl_type]
        return impl(url, **kwargs)


class SingleRedis(Redis):
    impl = 'redis'

    def __init__(self, url, **kwargs):
        super().__init__(url, **kwargs)
        self.url = url
        self.extra_kwargs = {k: v for k, v in kwargs.items() if v is not None}

    def _create_client(self) -> StrictRedis:
        return StrictRedis.from_url(
            self.url,
            retry_on_timeout=True,
            **self.extra_kwargs
        )
