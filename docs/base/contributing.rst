.. _contributing:

============
Contributing
============

Contributions are welcome. If you want to contribute, you should join the #enms channel in the networktocode slack (http://networktocode.herokuapp.com/).

For developers
--------------

eNMS uses flake8 to make sure that the code is PEP8-compliant, and pytest for the test suite.
There is a dedicated ``requirements_dev.txt`` file to install these libraries:

::

 pip install -r requirements_dev.txt

Before opening a pull request with your changes, you should make sure that:

::

 # your code is PEP8 (flake8) compliant 
 flake8
 
 # all the tests are passing
 cd /tests
 pytest

If one of these checks fails, so will Travis CI after opening the pull request.

If you are updating the documentation, you can build a local version of the docs:

::

 # build a local version of the docs
 cd /docs
 make html
